import { config } from './config.js'

export interface OpsResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface SystemSummary {
  healthy: boolean
  cacheHitRate: number | null
  queue: {
    queue: string
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  } | null
  uptime: number
  memory: NodeJS.MemoryUsage
}

export interface AuditReport {
  id: string
  startedAt: string
  completedAt: string
  durationMs: number
  totalTables: number
  tablesScanned: number
  totalIssues: number
  errorCount: number
  warningCount: number
  infoCount: number
  issuesByCategory: Record<string, number>
  tables: TableAudit[]
  summary: string
}

export interface TableAudit {
  tableName: string
  rowCount: number
  rlsEnabled: boolean
  hasAuditTrigger: boolean
  issues: TableIssue[]
}

export interface TableIssue {
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
  count: number
  detail: string
  repairSql?: string
}

export interface RepairResult {
  repair: string
  sql: string
  affectedRows: number
  success: boolean
  error?: string
}

export interface SafeQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  truncated: boolean
}

export interface QueueCounts {
  queue: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

interface HttpError extends Error {
  status?: number
}

function requestError(message: string, status?: number): HttpError {
  const err = new Error(message) as HttpError
  err.status = status
  return err
}

async function opsFetch<T>(path: string, options: RequestInit = {}): Promise<OpsResponse<T>> {
  const url = `${config.opsApiUrl}${path}`
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }

  if (config.opsSecret) {
    headers['x-ops-secret'] = config.opsSecret
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await response.text().catch(() => 'unknown')
    throw requestError(`Ops API error ${response.status}: ${body.slice(0, 200)}`, response.status)
  }

  const json: OpsResponse<T> = (await response.json()) as OpsResponse<T>
  return json
}

export const opsClient = {
  // ── Cache ────────────────────────────────────────────────

  async clearCache(pattern: string): Promise<{ cleared: number }> {
    const res = await opsFetch<{ cleared: number }>('/cache/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern }),
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Cache clear failed')
    }
    return res.data
  },

  // ── Queue ────────────────────────────────────────────────

  async getQueueCounts(): Promise<QueueCounts> {
    const res = await opsFetch<QueueCounts>('/queue/counts')
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Queue counts failed')
    }
    return res.data
  },

  // ── Rate Limit ───────────────────────────────────────────

  async updateRateLimit(limit: number): Promise<{ limit: number }> {
    const res = await opsFetch<{ limit: number }>('/rate-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Rate limit update failed')
    }
    return res.data
  },

  // ── Config ───────────────────────────────────────────────

  async readConfig(keys?: string[]): Promise<Record<string, string | undefined>> {
    const res = await opsFetch<Record<string, string | undefined>>('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Config read failed')
    }
    return res.data
  },

  // ── System Summary ───────────────────────────────────────

  async getSystemSummary(): Promise<SystemSummary> {
    const res = await opsFetch<SystemSummary>('/summary')
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'System summary failed')
    }
    return res.data
  },

  // ── Trigger ──────────────────────────────────────────────

  async triggerAgent(
    triggerType: string,
    severity: 'info' | 'warning' | 'critical',
    context: Record<string, unknown> = {}
  ): Promise<{ queued: boolean }> {
    const res = await opsFetch<{ queued: boolean }>('/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerType, severity, context }),
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Trigger failed')
    }
    return res.data
  },

  // ── Database Audit ────────────────────────────────────────

  async runAudit(): Promise<AuditReport> {
    const res = await opsFetch<AuditReport>('/db/audit', {
      method: 'POST',
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Audit failed')
    }
    return res.data
  },

  async getAuditStatus(): Promise<AuditReport | null> {
    const res = await opsFetch<AuditReport | null>('/db/audit/status')
    if (!res.success) {
      throw new Error(res.error ?? 'Audit status failed')
    }
    return res.data ?? null
  },

  async runRepair(tableName: string, issueCategory: string): Promise<RepairResult> {
    const res = await opsFetch<RepairResult>('/db/repair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName, issueCategory }),
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Repair failed')
    }
    return res.data
  },

  async runSafeQuery(sql: string): Promise<SafeQueryResult> {
    const res = await opsFetch<SafeQueryResult>('/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    })
    if (!res.success || !res.data) {
      throw new Error(res.error ?? 'Query failed')
    }
    return res.data
  },
}
