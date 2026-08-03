#!/usr/bin/env node
// design-ratchet.mjs — Design-system ad-hoc-glass ratchet gate.
//
// Enforces docs/design-system/RULES.md R2 (no ad-hoc glass on panels/cards) by
// counting banned patterns and failing CI when a category count INCREASES over
// the baseline. Existing usage is grandfathered; the ratchet is monotonic — it
// can only improve (via --update after intentional fixes), never regress.
//
// Why a ratchet and not strict zero-tolerance: R4 explicitly ALLOWS
// `bg-white/90` + `backdrop-blur-2xl` on transient surfaces (menus, modals,
// scrims, …). Panels/cards and transient surfaces can't be perfectly separated
// statically, so a strict gate would false-positive on legitimate R4 usage.
// The ratchet makes every increase a deliberate, reviewed act (run `--update`)
// while letting the existing grandfathered baseline stand. This is enforcement
// that behaves like a trace — monotonic, non-disruptive — fitting a
// traceability-first system. See docs/WAYFINDER.md → "Design-system enforcement".
//
// Standalone (NOT a turbo-cached task) so it can't return a stale PASS —
// sidesteps the turbo-eslint-cache-masking gotcha.
//
// Usage:
//   node tools/design-ratchet.mjs            # check (fails on regression)
//   node tools/design-ratchet.mjs --update   # rewrite baseline to current counts
//   node tools/design-ratchet.mjs --json     # emit counts as JSON

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const baselinePath = join(__dirname, 'design-ratchet.baseline.json')

// R4 transient surfaces — filenames containing these (case-insensitive) are
// exempt because R4 permits their lighter treatment.
const TRANSIENT = [
  'menu',
  'dropdown',
  'popover',
  'tooltip',
  'modal',
  'dialog',
  'scrim',
  'avatar',
  'skeleton',
  'command',
  'combobox',
]

// R2 banned patterns. Each matcher returns the count of violations in a line.
const CATEGORIES = {
  // backdrop-blur-* / backdrop-saturate-* on a panel/card re-asserts
  // backdrop-filter and overrides the canonical .glass-card / .os-shell blur.
  backdropBlur: (line) => (line.match(/backdrop-(?:blur|saturate)-[\w./-]+/g) || []).length,
  // Raw opacity surface fills: bg-white/40, bg-arch1/50, bg-arch-surface-…/80.
  bgOpacityFill: (line) =>
    (
      line.match(/bg-(?:white|black|arch\d+|arch-surface-[a-z-]+)\//g) || []
    ).length +
    (line.match(/bg-\[var\(--vibrancy-surface\)\]/g) || []).length,
  // Inline style rgba glass fills.
  inlineRgbaGlass: (line) =>
    (line.match(/(?:background|backgroundColor):\s*['"`]rgba\(/g) || []).length,
}

const SCAN_ROOTS = [
  join(root, 'apps/portal/src'),
  join(root, 'packages/ui/src'),
]

function isExemptFile(name) {
  const lower = name.toLowerCase()
  if (lower.includes('.test.') || lower.includes('.stories.') || lower.includes('.spec.')) {
    return true
  }
  return TRANSIENT.some((t) => lower.includes(t))
}

function walk(dir, acc = []) {
  let entries = []
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry === 'dist') continue
      walk(full, acc)
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry) && !isExemptFile(entry)) {
      acc.push(full)
    }
  }
  return acc
}

function countViolations() {
  const counts = { backdropBlur: 0, bgOpacityFill: 0, inlineRgbaGlass: 0 }
  const byFile = {}
  for (const scanRoot of SCAN_ROOTS) {
    for (const file of walk(scanRoot)) {
      const text = readFileSync(file, 'utf8')
      const lines = text.split('\n')
      let fileTotal = 0
      for (const line of lines) {
        for (const [cat, matcher] of Object.entries(CATEGORIES)) {
          const n = matcher(line)
          if (n) {
            counts[cat] += n
            fileTotal += n
          }
        }
      }
      if (fileTotal > 0) byFile[relative(root, file)] = fileTotal
    }
  }
  return { counts, byFile }
}

const args = new Set(process.argv.slice(2))
const update = args.has('--update')
const json = args.has('--json')

const { counts, byFile } = countViolations()

if (json) {
  process.stdout.write(JSON.stringify({ counts, byFile }, null, 2) + '\n')
  process.exit(0)
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : {}

let failures = 0
const improvements = []

for (const cat of Object.keys(CATEGORIES)) {
  const current = counts[cat]
  const base = baseline[cat] ?? 0
  if (current > base) {
    console.error(
      `FAIL: ${cat} regressed — ${current} (current) > ${base} (baseline). ` +
        `R2 bans ad-hoc glass on panels/cards. If this is a legitimate R4 ` +
        `transient surface, run \`node tools/design-ratchet.mjs --update\` ` +
        `after review.`
    )
    failures++
  } else if (current < base) {
    improvements.push(`${cat}: ${base} → ${current}`)
  } else {
    console.log(`ok: ${cat} = ${current} (baseline ${base})`)
  }
}

if (improvements.length) {
  console.log(
    `\nimprovement(s) detected:\n  ${improvements.join('\n  ')}\n` +
      `Run \`node tools/design-ratchet.mjs --update\` to ratchet the baseline down.`
  )
}

if (update) {
  writeFileSync(baselinePath, JSON.stringify(counts, null, 2) + '\n', 'utf8')
  console.log(`\nbaseline written → ${relative(root, baselinePath)}`)
}

if (failures > 0) {
  console.error(`\ndesign-ratchet failed with ${failures} regression(s).`)
  process.exit(1)
}

console.log('\ndesign-ratchet passed — no R2 regressions.')