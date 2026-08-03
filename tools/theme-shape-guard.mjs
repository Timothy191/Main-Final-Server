#!/usr/bin/env node
// theme-shape-guard.mjs — @repo/theme generated.ts presence guard.
//
// Protects against the documented failure mode (memory: theme-generated-ts-drift)
// where running `packages/theme/scripts/generate-tokens.mjs` SHRINKS
// `generated.ts` because the generator skips `--arch*` primitives (line 41:
// `if (name.startsWith("--arch")) continue`). The committed generated.ts
// contains 16 arch primitive references that a regenerate would drop, breaking
// GlassCard / ui-primitives tests.
//
// This is a presence/shape guard, NOT a regenerate-and-diff (a regenerate-and-diff
// would itself produce the shrunk file and be useless). It asserts the committed
// generated.ts retains its baseline shape: the arch primitive count must not
// drop, and the top-level token groups must still exist.
//
// Standalone (NOT turbo-cached) — sidesteps the stale-PASS gotcha.
//
// Usage:
//   node tools/theme-shape-guard.mjs          # check
//   node tools/theme-shape-guard.mjs --update # rewrite baseline to current shape

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const genPath = join(root, 'packages/theme/src/tokens/generated.ts')
const baselinePath = join(__dirname, 'theme-shape-guard.baseline.json')

const args = new Set(process.argv.slice(2))
const update = args.has('--update')

if (!readFileSync(genPath, 'utf8')) {
  console.error(`FAIL: generated.ts not found at ${relative(root, genPath)}`)
  process.exit(1)
}

const text = readFileSync(genPath, 'utf8')

// Shape checks — structural invariants of generated.ts.
const archCount = (text.match(/arch\d+/g) || []).length
const hasTokensExport = /export const tokens\b/.test(text)
const hasAsConst = /\bas const\b/.test(text)
const groups = {
  color: /^\s*color:/m.test(text),
  shadow: /^\s*shadow:/m.test(text),
  radius: /^\s*radius:/m.test(text),
  wave: /^\s*wave:/m.test(text),
}

const current = { archCount, hasTokensExport, hasAsConst, groups }
const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : null

let failures = 0
const fail = (m) => {
  console.error(`FAIL: ${m}`)
  failures++
}

if (!hasTokensExport) fail('generated.ts missing `export const tokens`')
if (!hasAsConst) fail('generated.ts missing `as const`')
for (const [g, present] of Object.entries(groups)) {
  if (!present) fail(`generated.ts missing top-level token group \`${g}\``)
}
if (!baseline) {
  if (update) {
    writeFileSync(baselinePath, JSON.stringify(current, null, 2) + '\n', 'utf8')
    console.log(`baseline seeded → ${relative(root, baselinePath)}`)
    console.log('theme-shape-guard passed — baseline seeded.')
    process.exit(0)
  }
  fail(
    `no baseline at ${relative(root, baselinePath)}. ` +
      `Run \`node tools/theme-shape-guard.mjs --update\` to seed it from the current shape.`
  )
} else if (archCount < baseline.archCount) {
  fail(
    `generated.ts arch primitive count regressed — ${archCount} < ${baseline.archCount} (baseline). ` +
      `Likely cause: someone ran generate-tokens.mjs, which skips --arch* primitives (line 41) ` +
      `and shrinks the file. Do NOT run generate-tokens.mjs for CSS value edits — edit ` +
      `packages/theme/src/css/variables.css directly. See memory: theme-generated-ts-drift.`
  )
} else if (archCount > baseline.archCount) {
  console.log(
    `note: arch primitive count increased — ${baseline.archCount} → ${archCount}. ` +
      `Run \`node tools/theme-shape-guard.mjs --update\` to ratchet the baseline up.`
  )
} else {
  console.log(`ok: archCount = ${archCount} (baseline ${baseline.archCount})`)
}

if (update) {
  writeFileSync(baselinePath, JSON.stringify(current, null, 2) + '\n', 'utf8')
  console.log(`\nbaseline written → ${relative(root, baselinePath)}`)
}

if (failures > 0) {
  console.error(`\ntheme-shape-guard failed with ${failures} issue(s).`)
  process.exit(1)
}
console.log('\ntheme-shape-guard passed — generated.ts shape intact.')