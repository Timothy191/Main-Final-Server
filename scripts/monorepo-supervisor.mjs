#!/usr/bin/env node

/**
 * monorepo-supervisor.mjs
 * Automated Dev/Prod Startup & Runtime Auto-Recovery System
 *
 * Layered recovery loop:
 *   Level 1 — deterministic self-healing (port conflicts, stale cache, missing deps, env drift,
 *             Redis/Supabase container restart).
 *   Level 2 — headless AI auto-wake via the local `agy` CLI when Level 1 cannot resolve a crash.
 *
 * Usage:
 *   node scripts/monorepo-supervisor.mjs dev       # supervised development stack
 *   node scripts/monorepo-supervisor.mjs start   # supervised production start
 *   node scripts/monorepo-supervisor.mjs reset     # clear recovery state file
 */

import { spawn, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

const PORT = process.env.PORT || '3000'
const LOG_DIR = path.join(REPO_ROOT, 'logs')
const LOG_FILE = path.join(LOG_DIR, 'app-runtime.log')
const STATE_FILE = path.join(REPO_ROOT, '.agent-recovery-state.json')
const RULES_FILE = path.join(REPO_ROOT, 'scripts/recovery-rules.json')

const DEFAULT_RULES = {
  rules: [
    {
      id: 'port_collision',
      name: 'Port collision (EADDRINUSE)',
      patterns: [
        'EADDRINUSE',
        'address already in use',
        'port is already in use',
        'listen EADDRINUSE',
      ],
      action: 'port_kill',
      level: 1,
      enabled: true,
    },
    {
      id: 'missing_module',
      name: 'Missing dependency / module resolution failure',
      patterns: [
        'Cannot find module',
        'MODULE_NOT_FOUND',
        'Error: Cannot resolve',
        'Module not found',
      ],
      action: 'install_deps',
      level: 1,
      enabled: true,
    },
    {
      id: 'stale_compile_cache',
      name: 'Stale build / compilation cache',
      patterns: [
        'Turbopack cache',
        'Next\.js build cache',
        'compilation error',
        'failed to compile',
        'Unexpected token',
        'SyntaxError',
      ],
      action: 'clear_cache',
      level: 1,
      enabled: true,
    },
    {
      id: 'missing_env_file',
      name: 'Missing environment file or required keys',
      patterns: [
        'ENOENT.*env',
        'missing.*env',
        'env.*missing',
        'Cannot read properties of undefined.*SUPABASE',
        'NEXT_PUBLIC_SUPABASE_URL is not defined',
      ],
      action: 'env_repair',
      level: 1,
      enabled: true,
    },
    {
      id: 'redis_connection_failure',
      name: 'Redis connection failure',
      patterns: ['ECONNREFUSED.*6379', 'Redis connection failed', 'Redis connection lost'],
      action: 'restart_redis',
      level: 1,
      enabled: true,
    },
    {
      id: 'supabase_connection_failure',
      name: 'Supabase / Postgres connection failure',
      patterns: ['ECONNREFUSED.*54321', 'Supabase.*unhealthy', 'auth/v1/health'],
      action: 'restart_supabase',
      level: 1,
      enabled: true,
    },
    {
      id: 'unknown_failure',
      name: 'Unclassified crash',
      patterns: [],
      action: 'level2_ai_wake',
      level: 2,
      enabled: true,
    },
  ],
  settings: {
    maxRestarts: 3,
    level2MaxAttempts: 1,
    stableRuntimeBeforeResetMs: 60000,
    logRingBufferLines: 300,
    agentPromptTemplate:
      'Next.js monorepo application crashed while running `{{mode}}` under the monorepo supervisor.\n\nReview the last {{lineCount}} lines of logs from `logs/app-runtime.log` and the failure reason below.\n\nFailure reason: {{failureReason}}\n\nRecent log tail:\n```\n{{logTail}}\n```\n\nTask requirements:\n1. Locate the failing source file(s) or configuration.\n2. Apply a minimal safe fix.\n3. Run `pnpm quality --force` (or the specific failing gate) and ensure it passes.\n4. Report what was changed and whether the supervisor should now restart successfully.\n\nDo not explain the plan; make the edit and verify it.',
  },
}

// ── Logging ───────────────────────────────────────────────────────────────────
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' })
function log(level, msg) {
  const timestamp = new Date().toISOString()
  const line = `[SUPERVISOR] [${level.toUpperCase()}] [${timestamp}] ${msg}`
  console.log(line)
  logStream.write(line + '\n')
}
function info(msg) {
  log('info', msg)
}
function warn(msg) {
  log('warn', msg)
}
function error(msg) {
  log('error', msg)
}

// ── Rules ───────────────────────────────────────────────────────────────────
function loadRules() {
  if (!fs.existsSync(RULES_FILE)) {
    warn(`Recovery rules file not found at ${RULES_FILE}; using built-in defaults.`)
    return DEFAULT_RULES
  }
  try {
    const raw = fs.readFileSync(RULES_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed.rules || !Array.isArray(parsed.rules) || !parsed.settings) {
      throw new Error('rules array and settings object are required')
    }
    // Compile string patterns into RegExps (case-insensitive).
    for (const rule of parsed.rules) {
      rule._regexes = rule.patterns.map((p) => new RegExp(p, 'i'))
    }
    return parsed
  } catch (e) {
    error(`Failed to load recovery rules: ${e.message}; using built-in defaults.`)
    for (const rule of DEFAULT_RULES.rules) {
      rule._regexes = rule.patterns.map((p) => new RegExp(p, 'i'))
    }
    return DEFAULT_RULES
  }
}

const RULES = loadRules()
const SETTINGS = RULES.settings

// ── State ───────────────────────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
    } catch (e) {
      warn(`Failed to parse state file: ${e.message}; resetting.`)
    }
  }
  return {
    restarts: 0,
    level2Attempts: 0,
    lastFailureReason: null,
    lastHealedAt: null,
    history: [],
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

function resetState() {
  saveState({
    restarts: 0,
    level2Attempts: 0,
    lastFailureReason: null,
    lastHealedAt: null,
    history: [],
  })
}

function resetRestarts(state) {
  state.restarts = 0
  state.lastFailureReason = null
  state.lastHealedAt = new Date().toISOString()
  saveState(state)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isRemoteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.length > 0 && !/127\.0\.0\.1|localhost/.test(url)
}

function runQuiet(cmd, args, options = {}) {
  try {
    execSync(cmd, { ...options, cwd: REPO_ROOT, stdio: 'pipe' })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message, stderr: e.stderr?.toString() || '' }
  }
}

// ── Level 1 Healers ───────────────────────────────────────────────────────────
function runPortKill() {
  info(`Level 1: freeing port :${PORT}`)
  try {
    const stdout = execSync(`lsof -t -i :${PORT}`, { cwd: REPO_ROOT, stdio: 'pipe' })
      .toString()
      .trim()
    if (stdout) {
      const pids = stdout.split('\n').filter(Boolean)
      for (const pid of pids) {
        info(`Killing PID ${pid} on :${PORT}`)
        try {
          process.kill(parseInt(pid, 10), 'SIGTERM')
        } catch {
          process.kill(parseInt(pid, 10), 'SIGKILL')
        }
      }
      // Wait briefly for the port to be released.
      for (let i = 0; i < 10; i++) {
        const stillOccupied = runQuiet('lsof', ['-t', `-i:${PORT}`])
        if (!stillOccupied.ok || !stillOccupied.stdout) break
        execSync('sleep 0.5', { cwd: REPO_ROOT, stdio: 'ignore' })
      }
      info(`Port :${PORT} freed.`)
      return true
    }
  } catch {
    // Fallback: fuser
    const result = runQuiet('fuser', ['-k', '-n', 'tcp', PORT])
    if (result.ok) {
      info(`Port :${PORT} freed via fuser.`)
      return true
    }
  }
  warn(`Could not free port :${PORT}.`)
  return false
}

function runInstallDeps() {
  info('Level 1: missing dependency detected; running pnpm install --frozen-lockfile...')
  try {
    execSync('pnpm install --frozen-lockfile', { cwd: REPO_ROOT, stdio: 'inherit' })
    info('Dependencies reinstalled.')
    return true
  } catch (e) {
    error(`pnpm install failed: ${e.message}`)
    return false
  }
}

function runClearCache() {
  info('Level 1: stale cache detected; running pnpm clean:all...')
  try {
    execSync('pnpm clean:all', { cwd: REPO_ROOT, stdio: 'inherit' })
    info('Caches cleared via pnpm clean:all.')
    return true
  } catch (e) {
    error(`pnpm clean:all failed: ${e.message}`)
    return false
  }
}

function runEnvRepair() {
  info('Level 1: missing environment detected.')
  const examplePath = path.join(REPO_ROOT, 'apps/portal/.env.example')
  const localPath = path.join(REPO_ROOT, 'apps/portal/.env.local')

  if (!fs.existsSync(localPath)) {
    if (fs.existsSync(examplePath)) {
      info('Copying apps/portal/.env.example to .env.local')
      fs.copyFileSync(examplePath, localPath)
      warn('IMPORTANT: .env.local was created from the example. Fill in real secrets before login.')
      return true
    }
    error('No apps/portal/.env.example found; cannot repair env.')
    return false
  }

  // Run the existing validator. We do NOT stub secret values.
  info('Running scripts/validate-env.sh --local to audit env...')
  try {
    execSync('bash scripts/validate-env.sh --local', { cwd: REPO_ROOT, stdio: 'inherit' })
    info('Environment validated.')
    return true
  } catch (e) {
    warn(`Environment validation failed: ${e.message}. Please fix the reported variables.`)
    return false
  }
}

function runRestartRedis() {
  if (isRemoteSupabase()) {
    info('Level 1: Redis failure with remote Supabase — skipping local container restart.')
    return false
  }
  info('Level 1: restarting arch-redis container...')
  const result = runQuiet('docker', ['restart', 'arch-redis'])
  if (result.ok) {
    info('Redis container restarted.')
    return true
  }
  warn('Failed to restart arch-redis container.')
  return false
}

function runRestartSupabase() {
  if (isRemoteSupabase()) {
    info('Level 1: Supabase failure with remote Supabase — skipping local stack restart.')
    return false
  }
  info('Level 1: restarting local Supabase stack...')
  try {
    execSync('pnpm supabase:stop || true', { cwd: REPO_ROOT, stdio: 'ignore' })
    execSync('pnpm supabase:start', { cwd: REPO_ROOT, stdio: 'inherit' })
    info('Local Supabase stack restarted.')
    return true
  } catch (e) {
    error(`Supabase restart failed: ${e.message}`)
    return false
  }
}

function runLevel1Healing(action) {
  switch (action) {
    case 'port_kill':
      return runPortKill()
    case 'install_deps':
      return runInstallDeps()
    case 'clear_cache':
      return runClearCache()
    case 'env_repair':
      return runEnvRepair()
    case 'restart_redis':
      return runRestartRedis()
    case 'restart_supabase':
      return runRestartSupabase()
    default:
      warn(`Unknown Level 1 action: ${action}`)
      return false
  }
}

// ── Level 2 AI Auto-Wake ────────────────────────────────────────────────────
function buildAgentPrompt({ mode, failureReason, logTail }) {
  let tpl = SETTINGS.agentPromptTemplate || DEFAULT_RULES.settings.agentPromptTemplate
  tpl = tpl.replace(/\{\{mode\}\}/g, mode)
  tpl = tpl.replace(/\{\{failureReason\}\}/g, failureReason)
  tpl = tpl.replace(/\{\{lineCount\}\}/g, String(logTail.length))
  tpl = tpl.replace(/\{\{logTail\}\}/g, logTail.join('\n'))
  return tpl
}

function findAgyPath() {
  // Prefer env override, then a local `agy` in PATH, then common install locations.
  if (process.env.AGY_BIN && fs.existsSync(process.env.AGY_BIN)) return process.env.AGY_BIN
  const candidates = [
    'agy',
    path.join(process.env.HOME || '/home/timothy', '.local/bin/agy'),
    '/usr/local/bin/agy',
    '/opt/agy/bin/agy',
  ]
  for (const c of candidates) {
    try {
      execSync(`command -v "${c}"`, { cwd: REPO_ROOT, stdio: 'ignore' })
      return c
    } catch {
      if (fs.existsSync(c)) return c
    }
  }
  return null
}

function runLevel2AutoWake({ mode, failureReason, logTail }) {
  // AGENT-TRACE: headless AI auto-wake boundary — only invoked after Level 1 rules exhaust.
  info('Level 2: no deterministic heal matched; invoking headless AI agent...')

  const agyPath = findAgyPath()
  if (!agyPath) {
    error('Level 2: `agy` CLI not found. Set AGY_BIN or add agy to PATH.')
    return false
  }

  const promptText = buildAgentPrompt({ mode, failureReason, logTail })
  const projectId = process.env.AGY_PROJECT || 'arch-systems'

  const args = [
    '--print',
    promptText,
    '--dangerously-skip-permissions',
    '--project',
    projectId,
    '--mode',
    'accept-edits',
    '--output-format',
    'text',
  ]

  if (process.env.AGY_MODEL) {
    args.push('--model', process.env.AGY_MODEL)
  }

  info(`Level 2: spawning ${agyPath} --print "..." --project ${projectId} --mode accept-edits`)

  try {
    execSync(`"${agyPath}" ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: { ...process.env, CLAUDE_CODE_NO_INTERRUPTS: '1' },
    })
    info('Level 2: AI agent execution finished.')
    return true
  } catch (e) {
    error(`Level 2: AI agent invocation failed: ${e.message}`)
    return false
  }
}

// ── Classification ────────────────────────────────────────────────────────────
function classify(logLines) {
  for (const rule of RULES.rules) {
    if (!rule.enabled) continue
    if (rule.level !== 1) continue
    for (const line of logLines) {
      for (const re of rule._regexes || []) {
        if (re.test(line)) {
          return rule
        }
      }
    }
  }
  return RULES.rules.find((r) => r.id === 'unknown_failure')
}

// ── Process Management ──────────────────────────────────────────────────────
function buildChildCommand(mode) {
  if (mode === 'dev') {
    return { cmd: 'bash', args: ['scripts/dev.sh', '--no-browser', '--no-monitors'] }
  }
  if (mode === 'start') {
    // AGENT-TRACE: start-prod.sh is invoked in foreground mode so the supervisor
    // monitors the actual Next.js process rather than a background launcher that exits immediately.
    return {
      cmd: 'bash',
      args: ['-c', 'pnpm --filter portal build && bash scripts/start-prod.sh --foreground'],
    }
  }
  throw new Error(`Unknown mode: ${mode}`)
}

function runApplication(mode, state) {
  const startTime = Date.now()

  if (state.restarts >= SETTINGS.maxRestarts) {
    error(
      `Safety circuit breaker: max restarts (${SETTINGS.maxRestarts}) reached. Manual intervention required.`
    )
    error(`State file: ${STATE_FILE}`)
    error(`Runtime log: ${LOG_FILE}`)
    process.exit(1)
  }

  info(
    `Starting application in [${mode}] mode (restart ${state.restarts}/${SETTINGS.maxRestarts})...`
  )

  const { cmd, args } = buildChildCommand(mode)
  info(`Spawning: ${cmd} ${args.join(' ')}`)

  const child = spawn(cmd, args, {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT, FORCE_COLOR: '1', TERM: process.env.TERM || 'xterm-256color' },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const ringBuffer = []
  const pushLine = (line) => {
    if (!line.trim()) return
    ringBuffer.push(line)
    if (ringBuffer.length > SETTINGS.logRingBufferLines) {
      ringBuffer.shift()
    }
  }

  const handleStream = (data) => {
    const chunk = data.toString()
    process.stdout.write(chunk)
    logStream.write(chunk)
    const lines = chunk.split('\n')
    for (let i = 0; i < lines.length - 1; i++) {
      pushLine(lines[i])
    }
    // Preserve any trailing partial line for next chunk.
    if (lines.length > 0) {
      const tail = lines[lines.length - 1]
      if (tail) pushLine(tail)
    }
  }

  child.stdout.on('data', handleStream)
  child.stderr.on('data', handleStream)

  const shutdown = (signal) => {
    if (!child.killed) {
      child.kill(signal)
    }
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  child.on('exit', (code, signal) => {
    const runtimeMs = Date.now() - startTime

    if (signal) {
      info(`Application process exited by signal ${signal}.`)
      resetState()
      process.exit(0)
    }

    info(`Application process exited with code ${code} (runtime ${runtimeMs}ms).`)

    if (code === 0 && runtimeMs >= SETTINGS.stableRuntimeBeforeResetMs) {
      info('Stable runtime reached; resetting restart counter.')
      resetRestarts(state)
      process.exit(0)
    }

    if (code === 0 && runtimeMs < SETTINGS.stableRuntimeBeforeResetMs) {
      info('Process exited quickly after a heal; treating as still-unstable and reclassifying.')
    }

    handleCrash(mode, ringBuffer, `Exit code ${code}`)
  })
}

function handleCrash(mode, logBuffer, reason) {
  const state = loadState()
  state.restarts += 1
  state.lastFailureReason = reason
  state.history.push({ timestamp: new Date().toISOString(), reason })
  saveState(state)

  warn(`Crash detected (attempt ${state.restarts}/${SETTINGS.maxRestarts}).`)
  const lastLogs = logBuffer.slice(-150)

  const rule = classify(lastLogs)
  info(`Classification: ${rule ? rule.name : 'Unclassified crash'}`)

  let healed = false
  if (rule && rule.level === 1) {
    healed = runLevel1Healing(rule.action)
    if (healed) {
      state.lastHealedAt = new Date().toISOString()
      saveState(state)
    }
  }

  if (!healed && state.level2Attempts < SETTINGS.level2MaxAttempts) {
    state.level2Attempts += 1
    saveState(state)
    healed = runLevel2AutoWake({ mode, failureReason: reason, logTail: lastLogs })
    if (healed) {
      state.lastHealedAt = new Date().toISOString()
      saveState(state)
    }
  } else if (!healed) {
    error('Level 1 did not resolve and Level 2 attempt limit reached.')
  }

  if (healed) {
    info('Heal reported success; restarting application...')
    // Give the OS a moment to release ports/containers before restarting.
    setTimeout(() => runApplication(mode, loadState()), 1500)
  } else {
    error('Self-healing exhausted. Recovery failed.')
    error(`State file: ${STATE_FILE}`)
    error(`Runtime log: ${LOG_FILE}`)
    process.exit(1)
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────────
const mode = process.argv[2] || 'dev'

if (mode === 'reset') {
  info('Resetting recovery state file.')
  resetState()
  process.exit(0)
}

if (mode !== 'dev' && mode !== 'start') {
  console.error('Usage: node scripts/monorepo-supervisor.mjs [dev|start|reset]')
  process.exit(1)
}

const initialState = loadState()
runApplication(mode, initialState)
