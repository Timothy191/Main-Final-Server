import { spawn } from 'node:child_process'

import { Logger } from '../logger.js'
import { config } from '../config.js'
import {
  type eveConfig,
  type eveDispatch,
  type eveId,
  type DispatchStatus,
  type DispatchTask,
  DEFAULT_EVE_CONFIGS,
} from './types.js'

const logger = new Logger('eve-dispatcher')

// ── State ──────────────────────────────────────────────────

const eveConfigs: eveConfig[] = resolveeveConfigs()
const pendingDispatches = new Map<string, eveDispatch>()
let dispatchCounter = 0

// ── Public API ─────────────────────────────────────────────

export function getConfiguredeves(): eveConfig[] {
  return eveConfigs.filter((e) => e.enabled).map((e) => ({ ...e }))
}

export function getDispatches(): eveDispatch[] {
  return [...pendingDispatches.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getDispatch(id: string): eveDispatch | undefined {
  return pendingDispatches.get(id)
}

export function resolveLatestDispatches(limit = 5): eveDispatch[] {
  return [...pendingDispatches.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export async function dispatchTask(task: DispatchTask): Promise<eveDispatch> {
  const eve = pickeve(task.eve)
  if (!eve) {
    throw new Error('No enabled eve agent available')
  }

  const dispatch: eveDispatch = {
    id: generateId(),
    eve: eve.id,
    task: task.task,
    prompt: task.prompt,
    status: 'pending',
    triggeredBy: task.triggeredBy,
    triggerRef: task.triggerRef,
    createdAt: new Date().toISOString(),
  }

  pendingDispatches.set(dispatch.id, dispatch)
  logger.info(`Dispatch ${dispatch.id} assigned to ${eve.id} (triggeredBy: ${task.triggeredBy})`)

  // Fire-and-forget spawn
  spawneveProcess(eve, dispatch).catch((err) => {
    logger.error(`Dispatch ${dispatch.id} failed: ${err.message}`)
  })

  return dispatch
}

// ── eve selection ──────────────────────────────────────────

function pickeve(preferred?: eveId): eveConfig | null {
  if (preferred) {
    const eve = eveConfigs.find((e) => e.id === preferred && e.enabled)
    if (eve) return eve
    logger.warn(`Preferred eve ${preferred} not available, falling back`)
  }
  return eveConfigs.find((e) => e.enabled) ?? null
}

// ── Process spawning ───────────────────────────────────────

async function spawneveProcess(eve: eveConfig, dispatch: eveDispatch): Promise<void> {
  updateStatus(dispatch, 'running')

  const cwd = config.projectRoot ?? process.cwd()
  const args = buildeveArgs(eve, dispatch.prompt, cwd)

  logger.info(`Spawning ${eve.id} for dispatch ${dispatch.id}: ${eve.cliPath} ${args.join(' ')}`)

  const child = spawn(eve.cliPath, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: eve.timeoutMs,
  })

  const stdoutChunks: Buffer[] = []
  const stderrChunks: Buffer[] = []

  child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
  child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

  try {
    await new Promise<void>((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Exit code ${code}`))
        }
      })
      child.on('error', reject)
    })

    const output = Buffer.concat(stdoutChunks).toString('utf-8')
    completeDispatch(dispatch, output)
  } catch (err) {
    const stderr = Buffer.concat(stderrChunks).toString('utf-8')
    failDispatch(dispatch, `${err instanceof Error ? err.message : String(err)}\n${stderr}`.trim())
  }
}

function buildeveArgs(eve: eveConfig, prompt: string, cwd: string): string[] {
  switch (eve.id) {
    case 'opencode':
      return buildOpencodeArgs(prompt, cwd, eve.autoApprove)
  }
}

function buildOpencodeArgs(prompt: string, cwd: string, autoApprove: boolean): string[] {
  const args = ['run', prompt, '--dir', cwd]
  if (autoApprove) args.push('--auto')
  return args
}

// ── Status helpers ─────────────────────────────────────────

function updateStatus(dispatch: eveDispatch, status: DispatchStatus): void {
  dispatch.status = status
}

function completeDispatch(dispatch: eveDispatch, output: string): void {
  dispatch.status = 'completed'
  dispatch.completedAt = new Date().toISOString()
  dispatch.output = output
  logger.info(`Dispatch ${dispatch.id} completed (${output.length} bytes)`)
}

function failDispatch(dispatch: eveDispatch, error: string): void {
  dispatch.status = 'failed'
  dispatch.completedAt = new Date().toISOString()
  dispatch.error = error
  logger.error(`Dispatch ${dispatch.id} failed: ${error}`)
}

// ── Config resolution ─────────────────────────────────────

function resolveeveConfigs(): eveConfig[] {
  return DEFAULT_EVE_CONFIGS.map((defaultConfig) => {
    const prefix = `EVE_${defaultConfig.id.toUpperCase()}`
    return {
      ...defaultConfig,
      enabled: defaultEnabled(prefix),
      autoApprove: defaultAutoApprove(prefix),
      timeoutMs: Number(process.env[`${prefix}_TIMEOUT_MS`] ?? defaultConfig.timeoutMs),
    }
  })
}

function defaultEnabled(prefix: string): boolean {
  const raw = process.env[`${prefix}_ENABLED`]
  if (raw === undefined) return true
  return raw === '1' || raw === 'true'
}

function defaultAutoApprove(prefix: string): boolean {
  const raw = process.env[`${prefix}_AUTO_APPROVE`]
  if (raw === undefined) return false
  return raw === '1' || raw === 'true'
}

// ── ID generation ──────────────────────────────────────────

function generateId(): string {
  dispatchCounter++
  const stamp = Date.now().toString(36)
  const seq = dispatchCounter.toString(36).padStart(4, '0')
  return `eve-${stamp}-${seq}`
}
