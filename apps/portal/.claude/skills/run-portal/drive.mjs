#!/usr/bin/env node
// run-portal driver — launches the Arch Systems Portal dev server and drives
// the /login page with headless Chromium via Playwright, ending in a screenshot.
//
// Self-contained: sets the fallback env vars a clean machine needs (the real
// .env.local is gitignored), starts `next dev`, polls until /login serves,
// then fills the login form and screenshots it. Kills the whole server
// process group on exit.
//
// Usage:
//   node .claude/skills/run-portal/drive.mjs                # /login, default shot
//   node .claude/skills/run-portal/drive.mjs /hub           # custom path
//   node .claude/skills/run-portal/drive.mjs /login /tmp/portal-shots/login.png
//
// Env overrides:
//   PORTAL_PORT (default 3000)  SHOT_DIR (default /tmp/portal-shots)
//   CHROMIUM_BIN (default /usr/bin/chromium)

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
// drive.mjs → run-portal/ → skills/ → .claude/ → apps/portal/  →  repo root
const PORTAL_DIR = resolve(__dirname, '../../..')
const REPO_ROOT = resolve(__dirname, '../../../..')
const PORT = Number(process.env.PORTAL_PORT || 3000)
const SHOT_DIR = process.env.SHOT_DIR || '/tmp/portal-shots'
const CHROMIUM_BIN = process.env.CHROMIUM_BIN || '/usr/bin/chromium'

const route = process.argv[2] || '/login'
const shotPath =
  process.argv[3] || resolve(SHOT_DIR, `${(route || 'root').replace(/\//g, '_') || 'root'}.png`)
const url = `http://localhost:${PORT}${route}`

let server = null
let browser = null

function log(...a) {
  console.error('[drive]', ...a)
}

// Fallback env for a clean machine — .env.local is gitignored and absent on
// clone. /login renders without ever calling Supabase (no auth cookie → the
// middleware and the page both skip the Supabase branch), so unreachable
// localhost values are fine; they just must exist so client construction
// doesn't throw at import time.
const ENV = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: String(PORT),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key',
  NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
  NEXT_PUBLIC_APP_NAME: 'Arch Systems',
  SENTRY_DSN: '',
  NEXT_PUBLIC_SENTRY_DSN: '',
  // Skip Sentry upload + heavy plugins in dev.
  NEXT_OTEL_VERBOSE: '0',
}

async function waitForServer(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs
  let attempt = 0
  while (Date.now() < deadline) {
    attempt++
    try {
      const res = await fetch(url, { headers: { Accept: 'text/html' } })
      // Any HTML response means the dev server is compiling/serving.
      if (res.ok || res.status < 500) {
        log(`server ready (status ${res.status}) after ${attempt} polls`)
        return true
      }
    } catch {
      // not up yet
    }
    await sleep(1000)
  }
  throw new Error(`server did not respond at ${url} within ${timeoutMs / 1000}s`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true })

  log(`starting dev server: pnpm --filter portal dev (port ${PORT})`)
  // detached:true → own process group so we can kill the whole tree (pnpm → next dev)
  server = spawn('pnpm', ['--filter', 'portal', 'dev'], {
    cwd: REPO_ROOT,
    env: ENV,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let serverLog = ''
  const onChunk = (b) => {
    const s = b.toString()
    serverLog += s
    // echo the tail so we can see compile progress
    process.stderr.write(s)
  }
  server.stdout.on('data', onChunk)
  server.stderr.on('data', onChunk)
  server.on('exit', (code) => log(`dev server exited with code ${code}`))

  try {
    await waitForServer()

    log(`launching chromium: ${CHROMIUM_BIN}`)
    browser = await chromium.launch({
      executablePath: CHROMIUM_BIN,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

    const consoleErrors = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))

    log(`navigating to ${url}`)
    // First-hit Turbopack compile can take 10s+; wait for the email input.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.waitForSelector('input[name="email"]', { timeout: 60000 })

    // Real interaction: fill the login form (do NOT submit — Supabase is down,
    // submitting would just time out into a toast).
    await page.fill('input[name="email"]', 'agent@arch.local')
    await page.fill('input[name="password"]', 'smoke-test-password')
    await page.screenshot({ path: shotPath, fullPage: false })
    log(`screenshot → ${shotPath}`)

    // Also grab the visible chrome text as a cheap render assertion.
    const chromeText = await page
      .locator('body')
      .innerText()
      .catch(() => '')
    const hasLoginChrome = /Sign In/i.test(chromeText)
    log(`page text contains "Sign In": ${hasLoginChrome}`)

    if (consoleErrors.length) {
      log(`console errors (${consoleErrors.length}):`)
      for (const e of consoleErrors.slice(0, 12)) log(`  ! ${e}`)
    } else {
      log('no console errors')
    }

    // Write a small JSON summary next to the screenshot for agents to parse.
    const summaryPath = resolve(shotPath.replace(/\.png$/, '') + '.json')
    writeFileSync(
      summaryPath,
      JSON.stringify(
        { url, shotPath, hasLoginChrome, consoleErrors: consoleErrors.slice(0, 20) },
        null,
        2
      )
    )
    log(`summary → ${summaryPath}`)

    if (!hasLoginChrome) {
      log('WARNING: login chrome text not found — screenshot may show an error page')
    }
  } finally {
    log('tearing down')
    if (browser) await browser.close().catch(() => {})
    if (server && server.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM') // kill the process group
      } catch {
        try {
          server.kill('SIGTERM')
        } catch {}
      }
    }
  }
}

main().catch((e) => {
  log('FATAL:', e?.stack || e)
  if (browser) browser.close().catch(() => {})
  if (server && server.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM')
    } catch {}
  }
  process.exit(1)
})