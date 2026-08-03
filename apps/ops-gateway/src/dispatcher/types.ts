// ── eve agent types ─────────────────────────────────────────
// eve = TUI agent dispatched for investigation & repair

export type eveId = 'opencode'

export interface eveConfig {
  id: eveId
  cliPath: string
  enabled: boolean
  autoApprove: boolean
  timeoutMs: number
}

export type DispatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timed_out'

export type DispatchTrigger = 'incident' | 'trigger' | 'mcp' | 'manual'

export interface eveDispatch {
  id: string
  eve: eveId
  task: string
  prompt: string
  status: DispatchStatus
  context?: Record<string, unknown>
  triggeredBy: DispatchTrigger
  triggerRef?: string
  createdAt: string
  completedAt?: string
  output?: string
  error?: string
}

export interface DispatchTask {
  prompt: string
  eve?: eveId
  context?: Record<string, unknown>
  triggeredBy: DispatchTrigger
  triggerRef?: string
  task: string
}

// ── Default configs ─────────────────────────────────────────

export const DEFAULT_EVE_CONFIGS: eveConfig[] = [
  {
    id: 'opencode',
    cliPath: 'opencode',
    enabled: true,
    autoApprove: false,
    timeoutMs: 120_000,
  },
]
