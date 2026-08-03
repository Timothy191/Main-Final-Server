import { config } from '../config.js'
import { getLatestHealth } from '../poller/health-poller.js'
import { getLatestSnapshot } from '../poller/metrics-poller.js'
import { getLatestAudit, runAuditCheck } from '../poller/audit-poller.js'
import { opsClient } from '../ops-client.js'
import { Logger } from '../logger.js'
import { dispatchTask } from '../dispatcher/eve-dispatcher.js'
import type { Triggerevent } from '../subscriber/redis-subscriber.js'

const logger = new Logger('incident-engine')

// ── Types ──────────────────────────────────────────────────

export interface Incident {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  message: string
  context: Record<string, unknown>
  detectedAt: string
  resolvedAt: string | null
  autoMitigated: boolean
}

// Track incidents that have already triggered a TUI agent dispatch
const dispatchedIncidents = new Set<string>()

// ── State ──────────────────────────────────────────────────

const activeIncidents = new Map<string, Incident>()
const completedIncidents: Incident[] = []

// Rolling window for 5xx counting
const errorTimestamps: number[] = []

// Counter for unique incident IDs
let incidentCounter = 0

// ── Public API ─────────────────────────────────────────────

export function getActiveIncidents(): Incident[] {
  return [...activeIncidents.values()]
}

export function getCompletedIncidents(): Incident[] {
  return [...completedIncidents]
}

// ── event handler (called by Redis subscriber) ─────────────

export async function handleTriggerevent(event: Triggerevent): Promise<void> {
  const incident: Incident = {
    id: event.id,
    severity: event.severity as Incident['severity'],
    type: event.triggerType,
    message: `Trigger: ${event.triggerType} (${event.severity})`,
    context: event.context as Record<string, unknown>,
    detectedAt: new Date().toISOString(),
    resolvedAt: null,
    autoMitigated: false,
  }

  activeIncidents.set(incident.id, incident)
  logger.warn(`Active incident: ${incident.severity}/${incident.type}`)

  // Attempt auto-mitigation for known incident types
  await attemptAutoMitigation(incident)

  // Dispatch to TUI agent for critical and warning triggers
  if (
    config.enableAgentDispatch &&
    (incident.severity === 'critical' || incident.severity === 'warning')
  ) {
    dispatchToAgent(incident).catch(() => {
      /* dispatch is fire-and-forget */
    })
  }
}

// ── Periodic check (called by main loop) ───────────────────

export async function periodicIncidentCheck(): Promise<void> {
  const health = getLatestHealth()
  const metrics = getLatestSnapshot()

  // 1. Check for backend unreachability
  if (health && health.status === 'unreachable') {
    await createOrUpdateIncident({
      severity: 'critical',
      type: 'BACKEND_UNREACHABLE',
      message: 'NestJS backend health check failed',
      context: { lastHealth: health },
    })
  }

  // 2. Check cache health
  if (health && health.status === 'healthy') {
    // Backend is reachable again — resolve any unreachability incidents
    resolveIncidentsByType('BACKEND_UNREACHABLE', 'Backend is reachable again')
  }

  // 3. Check error rate from Prometheus metrics
  if (metrics) {
    const windowStart = Date.now() - config.incidentWindowMs
    // Keep only recent errors
    while (errorTimestamps.length > 0 && errorTimestamps[0]! < windowStart) {
      errorTimestamps.shift()
    }

    // If we see new errors in metrics, record them
    if (metrics.recent5xx > 0) {
      errorTimestamps.push(...Array(metrics.recent5xx).fill(Date.now()))
    }

    if (errorTimestamps.length >= config.incidentThreshold5xx) {
      await createOrUpdateIncident({
        severity: 'warning',
        type: 'HIGH_ERROR_RATE',
        message: `${errorTimestamps.length} errors in the last ${config.incidentWindowMs / 1000}s window`,
        context: {
          errorCount: errorTimestamps.length,
          threshold: config.incidentThreshold5xx,
          windowMs: config.incidentWindowMs,
        },
      })
    } else {
      resolveIncidentsByType('HIGH_ERROR_RATE', 'Error rate returned to normal')
    }
  }

  // 4. Database audit check (every cycle)
  if (health && health.status === 'healthy') {
    try {
      const audit = await runAuditCheck()
      if (audit && audit.errorCount > 0) {
        await createOrUpdateIncident({
          severity: 'warning',
          type: 'DATA_INTEGRITY_ISSUE',
          message: `${audit.errorCount} data integrity error(s) found: ${audit.summary}`,
          context: {
            auditId: audit.id,
            errorCount: audit.errorCount,
            warningCount: audit.warningCount,
            issuesByCategory: audit.issuesByCategory,
          },
        })
      } else {
        resolveIncidentsByType('DATA_INTEGRITY_ISSUE', 'Data integrity audit passed')
      }
    } catch {
      // Non-fatal — audit will retry next cycle
    }
  }
}

// ── Auto-mitigation ────────────────────────────────────────

async function attemptAutoMitigation(incident: Incident): Promise<void> {
  // Auto-mitigation rules — safe, reversible actions only
  try {
    switch (incident.type) {
      case 'SERVER_CRASH': {
        // Rate limit spike after crash — reduce limit to protect backend
        logger.warn('Auto-mitigation: reducing rate limit after crash')
        await opsClient.updateRateLimit(50)
        incident.autoMitigated = true
        break
      }

      case 'DATA_INTEGRITY_ISSUE': {
        // Attempt auto-repair on orphaned rows and stale data — per-table
        const audit = getLatestAudit()
        if (audit && audit.tablesByIssue) {
          const repairPriority: string[] = ['orphaned_rows', 'stale_data']
          for (const category of repairPriority) {
            const tables = audit.tablesByIssue[category]
            if (!tables || tables.length === 0) continue
            logger.info(`Auto-mitigation: repairing ${category} across ${tables.length} table(s)`)
            for (const tableName of tables) {
              try {
                const result = await opsClient.runRepair(tableName, category)
                if (result.affectedRows > 0) {
                  logger.info(
                    `Auto-repair ${category} on ${tableName}: fixed ${result.affectedRows} row(s)`
                  )
                }
              } catch {
                // Per-table repair is best-effort
              }
            }
          }
        }
        incident.autoMitigated = true
        break
      }
      case 'HIGH_MEMORY': {
        // Clear cache to free memory
        logger.warn('Auto-mitigation: clearing cache on high memory')
        await opsClient.clearCache('cache:*')
        incident.autoMitigated = true
        break
      }

      default:
        // No auto-mitigation for this type — log and wait
        logger.debug(`No auto-mitigation for ${incident.type}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Auto-mitigation failed for ${incident.type}: ${message}`)
  }
}

// ── TUI agent dispatch helper ──────────────────────────────

async function dispatchToAgent(incident: Incident): Promise<void> {
  // Build context payload for the TUI agent
  const health = getLatestHealth()
  const metrics = getLatestSnapshot()
  const audit = getLatestAudit()

  const context: Record<string, unknown> = {
    incident: {
      type: incident.type,
      severity: incident.severity,
      message: incident.message,
      ...incident.context,
    },
    health: health
      ? {
          status: health.status,
          summary: health.summary,
          timestamp: health.timestamp,
        }
      : undefined,
    metrics: metrics
      ? {
          errorRate: metrics.errorRate,
          recent5xx: metrics.recent5xx,
          totalRequests: metrics.totalRequests,
          cacheHits: metrics.cacheHits,
          cacheMisses: metrics.cacheMisses,
          snapshotAt: metrics.snapshotAt,
        }
      : undefined,
    audit: audit
      ? {
          errorCount: audit.errorCount,
          warningCount: audit.warningCount,
          tables: audit.tablesByIssue,
        }
      : undefined,
  }

  const prompt = [
    `## Ops-Gateway Incident: ${incident.type} (${incident.severity})`,
    ``,
    `${incident.message}`,
    ``,
    `### Context snapshot`,
    `\`\`\`json`,
    JSON.stringify(context, null, 2),
    `\`\`\``,
    ``,
    `### Required actions`,
    `1. Investigate the incident using available tools (database queries, log inspection)`,
    `2. Determine root cause`,
    `3. Apply fix if deterministic and safe`,
    `4. Report findings back`,
    ``,
    `Project: ${config.projectRoot}`,
  ].join('\n')

  try {
    const dispatch = await dispatchTask({
      task: `Investigate and resolve ${incident.type}`,
      prompt,
      context,
      triggeredBy: 'incident',
      triggerRef: incident.id,
    })
    logger.info(`Dispatched to ${dispatch.eve} for incident ${incident.type} (${dispatch.id})`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn(`Agent dispatch failed for ${incident.type}: ${message}`)
  }
}

// ── Helpers ────────────────────────────────────────────────

const knownIncidents = new Map<string, string>() // type -> id

async function createOrUpdateIncident(
  partial: Omit<Incident, 'id' | 'detectedAt' | 'resolvedAt' | 'autoMitigated'>
): Promise<void> {
  const existingId = knownIncidents.get(partial.type)
  if (existingId && activeIncidents.has(existingId)) {
    return // Already active — no update needed
  }

  incidentCounter++
  const id = `inc_${Date.now()}_${incidentCounter}`
  const incident: Incident = {
    ...partial,
    id,
    detectedAt: new Date().toISOString(),
    resolvedAt: null,
    autoMitigated: false,
  }

  activeIncidents.set(id, incident)
  knownIncidents.set(partial.type, id)
  logger.warn(`Incident created: ${incident.severity}/${incident.type}`)

  // Dispatch to TUI agent for critical and warning incidents
  if (config.enableAgentDispatch !== false && !dispatchedIncidents.has(incident.type)) {
    dispatchedIncidents.add(incident.type)
    dispatchToAgent(incident).catch(() => {
      /* dispatch is fire-and-forget */
    })
  }
  // Attempt auto-mitigation for newly detected incidents
  await attemptAutoMitigation(incident)
}

function resolveIncidentsByType(type: string, reason: string): void {
  const id = knownIncidents.get(type)
  if (!id) return

  const incident = activeIncidents.get(id)
  if (!incident) {
    knownIncidents.delete(type)
    return
  }

  incident.resolvedAt = new Date().toISOString()
  incident.context['resolution'] = reason
  completedIncidents.push(incident)
  activeIncidents.delete(id)
  knownIncidents.delete(type)

  logger.info(`Incident resolved: ${type} — ${reason}`)
}
