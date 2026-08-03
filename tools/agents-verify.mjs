#!/usr/bin/env node
// Verify that AGENTS.md (the canonical agent policy) stays in sync with the
// files it references, and that the portal CLAUDE.md links back to it.
// Runs in CI as `pnpm agents:verify`. Exits non-zero on any broken reference.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const agentsPath = join(root, 'AGENTS.md')
const claudePath = join(root, 'apps/portal/CLAUDE.md')

let failures = 0
const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  failures++
}

if (!existsSync(agentsPath)) {
  fail('AGENTS.md not found at repo root')
  process.exit(1)
}

const agents = readFileSync(agentsPath, 'utf8')

// 1. Every relative markdown link in AGENTS.md must resolve to an existing path.
const linkRe = /\]\((\.\.?\/[^)\s]+)\)/g
const seen = new Set()
let m
while ((m = linkRe.exec(agents)) !== null) {
  const href = m[1]
  if (seen.has(href)) continue
  seen.add(href)
  const pathPart = href.split('#')[0].replace(/\/$/, '')
  if (!pathPart) continue
  if (!existsSync(join(root, pathPart))) {
    fail(`AGENTS.md references missing path: ${href}`)
  }
}

// 2. The design-system trio is the global rule — guard it explicitly.
for (const f of [
  'docs/design-system/RULES.md',
  'docs/design-system/SPEC.md',
  'docs/design-system/DESIGN.md',
]) {
  if (!existsSync(join(root, f))) {
    fail(`Design-system global rule file missing: ${f}`)
  }
}

// 3. Reverse linkage: portal CLAUDE.md must point back to canonical AGENTS.md.
if (existsSync(claudePath)) {
  const claude = readFileSync(claudePath, 'utf8')
  if (!/AGENTS\.md/.test(claude)) {
    fail('apps/portal/CLAUDE.md does not reference the canonical AGENTS.md policy')
  }
} else {
  fail('apps/portal/CLAUDE.md not found')
}

if (failures > 0) {
  console.error(`\nagents:verify failed with ${failures} issue(s).`)
  process.exit(1)
}

console.log('agents:verify passed — AGENTS.md references are in sync.')