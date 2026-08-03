import { Logger } from '../logger.js'
import { config } from '../config.js'

const logger = new Logger('metrics-poller')

export interface MetricSnapshot {
  recent5xx: number
  totalRequests: number
  errorRate: number
  cacheHits: number
  cacheMisses: number
  windowStart: number
  snapshotAt: string
}

let latestSnapshot: MetricSnapshot | null = null

export function getLatestSnapshot(): MetricSnapshot | null {
  return latestSnapshot
}

function parseMetricValue(text: string, metricName: string): number | null {
  const escapedName = metricName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = `^${escapedName}[{ ]`
  const regex = new RegExp(pattern, 'm')
  const match = text.match(regex)
  if (match === null) return null

  const lineStart = match.index!
  const lineEnd = text.indexOf('\n', lineStart)
  const line = lineEnd === -1 ? text.slice(lineStart) : text.slice(lineStart, lineEnd)

  const parts = line.split(/\s+/)
  return parts.length >= 2 ? Number(parts[parts.length - 1]) : null
}

export async function pollMetrics(): Promise<void> {
  const metricsUrl = process.env.METRICS_URL ?? 'http://host.docker.internal:3001/api/metrics'

  try {
    const response = await fetch(metricsUrl)
    if (!response.ok) {
      logger.warn(`Metrics endpoint returned ${response.status}`)
      return
    }

    const rawText = await response.text()

    const cacheHits =
      (parseMetricValue(rawText, 'portal_cache_hits_total') ?? 0) +
      (parseMetricValue(rawText, 'portal_cache_hits_total{source') ?? 0)
    const cacheMisses = parseMetricValue(rawText, 'portal_cache_misses_total') ?? 0

    const inngestErrors = parseMetricValue(rawText, 'portal_inngest_job_errors_total') ?? 0
    const dbErrors = parseMetricValue(rawText, 'portal_db_query_errors_total') ?? 0
    const recent5xx = inngestErrors + dbErrors

    latestSnapshot = {
      recent5xx,
      totalRequests: 0,
      errorRate: 0,
      cacheHits,
      cacheMisses,
      windowStart: Date.now() - config.metricsPollIntervalMs,
      snapshotAt: new Date().toISOString(),
    }

    logger.debug(`Metrics: ${cacheHits} hits, ${cacheMisses} misses, ${recent5xx} errors`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn(`Metrics poll failed: ${message}`)
  }
}

export function startMetricsPoller(): void {
  logger.info(`Starting metrics poller (interval: ${config.metricsPollIntervalMs}ms)`)

  pollMetrics().catch((e) =>
    logger.error(`Initial metrics poll failed: ${e instanceof Error ? e.message : String(e)}`)
  )

  setInterval(() => {
    pollMetrics().catch((e) =>
      logger.error(`Metrics poll cycle failed: ${e instanceof Error ? e.message : String(e)}`)
    )
  }, config.metricsPollIntervalMs)
}
