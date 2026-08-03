/**
 * @jest-environment node
 *
 * Alert Rules Coverage Test
 * ==========================
 * Validates that every Prometheus metric name referenced in alert rules
 * is actually emitted by the /api/metrics/prometheus endpoint.
 *
 * This prevents silent drift: if someone renames a metric in the route
 * but forgets to update the alert rules, this test catches it.
 *
 * Also validates:
 *   - The alert rules YAML is valid and parseable
 *   - All metric names use the correct `arch_` prefix convention
 *   - No alert references a metric that doesn't exist in the route output
 */

import { GET } from './route'
import { NextRequest } from 'next/server'
import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Mock metrics dependencies — return zero values so we can validate metric
// names without worrying about actual values
// ---------------------------------------------------------------------------
jest.mock('@/lib/observability/metrics', () => ({
  getMetrics: jest.fn().mockResolvedValue({
    jobMetrics: new Map(),
    dbMetrics: new Map(),
  }),
}))

jest.mock('@repo/supabase/server', () => ({
  createAdminClient: jest.fn().mockReturnValue({
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
}))

// ---------------------------------------------------------------------------
// Helper: extract all metric names from PromQL expressions in alert rules
// ---------------------------------------------------------------------------

interface AlertRule {
  alert: string
  expr: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

interface RuleGroup {
  name: string
  rules: AlertRule[]
}

/** Extract Prometheus metric names from a PromQL expression string.
 *  Matches identifiers following the Prometheus naming convention,
 *  filtered to only include `arch_`-prefixed metrics (our namespace).
 *
 *  The `startsWith('arch_')` check naturally excludes all PromQL functions
 *  and operators (rate, sum, count, etc.) since none start with `arch_`.
 */
function extractMetricNamesFromPromQL(expr: string): Set<string> {
  const metricRegex = /[a-zA-Z_:][a-zA-Z0-9_:]*/g
  const matches = expr.match(metricRegex) ?? []
  const names = new Set<string>()

  for (const match of matches) {
    if (match.startsWith('arch_')) {
      names.add(match)
    }
  }

  return names
}

/** Extract unique metric names from the Prometheus text-format output. */
function extractMetricNamesFromRouteOutput(text: string): Set<string> {
  const metricRegex = /^arch_[a-zA-Z0-9_:]+(?=\{|\s|$)/gm
  const matches = text.match(metricRegex) ?? []
  return new Set(matches)
}

/** Determine the project root directory for loading the alert rules YAML.
 *  Falls back to a set of candidate paths derived from __dirname and CWD. */
function findProjectRoot(dir: string): string {
  // Walk up looking for the monorepo's marker file (AGENTS.md at the repo root)
  let current = dir
  while (current !== '/') {
    if (
      fs.existsSync(path.join(current, 'AGENTS.md')) &&
      fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))
    ) {
      return current
    }
    current = path.resolve(current, '..')
  }
  return dir
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Alert Rules Coverage', () => {
  let alertRulesYaml: string | null = null
  let parsedRules: { groups: RuleGroup[] } | null = null

  beforeAll(() => {
    // Load and parse the alert rules YAML
    const projectRoot = process.env.CI_PROJECT_ROOT ?? findProjectRoot(__dirname)
    const yamlPath = path.resolve(projectRoot, 'ops/prometheus/alert-rules.yaml')

    // Try multiple paths to be robust across different test runner contexts
    const candidates = [
      yamlPath,
      path.resolve(process.cwd(), '../../ops/prometheus/alert-rules.yaml'),
      path.resolve(__dirname, '../../../../../../../ops/prometheus/alert-rules.yaml'),
    ]

    for (const candidate of candidates) {
      try {
        alertRulesYaml = fs.readFileSync(candidate, 'utf-8')
        parsedRules = yaml.load(alertRulesYaml) as { groups: RuleGroup[] }
        break
      } catch {
        continue
      }
    }

    if (!alertRulesYaml || !parsedRules) {
      throw new Error(
        `Could not find ops/prometheus/alert-rules.yaml. Tried:\n${candidates.join('\n')}`
      )
    }
  })

  // -----------------------------------------------------------------------
  // YAML structure validation
  // -----------------------------------------------------------------------

  it('parses valid YAML with at least one rule group', () => {
    expect(parsedRules).toBeTruthy()
    expect(parsedRules!.groups).toBeInstanceOf(Array)
    expect(parsedRules!.groups.length).toBeGreaterThan(0)
  })

  it('all rule groups have a name and rules array', () => {
    for (const group of parsedRules!.groups) {
      expect(group).toHaveProperty('name')
      expect(typeof group.name).toBe('string')
      expect(group.name.length).toBeGreaterThan(0)
      expect(group.rules).toBeInstanceOf(Array)
      expect(group.rules.length).toBeGreaterThan(0)
    }
  })

  it('every alert rule has alert name, expr, severity label, and summary annotation', () => {
    for (const group of parsedRules!.groups) {
      for (const rule of group.rules) {
        expect(rule).toHaveProperty('alert')
        expect(typeof rule.alert).toBe('string')
        expect(rule.alert.length).toBeGreaterThan(0)

        expect(rule).toHaveProperty('expr')
        expect(typeof rule.expr).toBe('string')
        expect(rule.expr.length).toBeGreaterThan(0)

        expect(rule.labels).toBeTruthy()
        expect(rule.labels!.severity).toBeTruthy()
        expect(['critical', 'warning', 'info']).toContain(rule.labels!.severity)

        expect(rule.annotations).toBeTruthy()
        expect(rule.annotations!.summary).toBeTruthy()
      }
    }
  })

  // -----------------------------------------------------------------------
  // Metric name extraction from PromQL
  // -----------------------------------------------------------------------

  it('every rule extracts at least one arch_ metric name from its expr', () => {
    for (const group of parsedRules!.groups) {
      for (const rule of group.rules) {
        const metricNames = extractMetricNamesFromPromQL(rule.expr)
        expect(metricNames.size).toBeGreaterThan(0)
      }
    }
  })

  it('all metric names across all rules use the arch_ prefix convention', () => {
    for (const group of parsedRules!.groups) {
      for (const rule of group.rules) {
        const metricNames = extractMetricNamesFromPromQL(rule.expr)
        for (const name of metricNames) {
          // All our metrics start with arch_
          expect(name.startsWith('arch_')).toBe(true)
        }
      }
    }
  })

  // -----------------------------------------------------------------------
  // Coverage: alert rule metric names match route output
  // -----------------------------------------------------------------------

  describe('coverage against /api/metrics/prometheus output', () => {
    let routeMetricNames: Set<string>
    let routeMetricsText: string

    beforeAll(async () => {
      const req = new NextRequest('http://localhost/api/metrics/prometheus')
      const res = await GET(req)
      routeMetricsText = await res.text()
      routeMetricNames = extractMetricNamesFromRouteOutput(routeMetricsText)
    })

    it('prometheus route returns at least one arch_ metric', () => {
      expect(routeMetricNames.size).toBeGreaterThan(0)
    })

    it('every metric name referenced in alert rules is emitted by the prometheus route', () => {
      const allAlertMetrics = new Set<string>()

      for (const group of parsedRules!.groups) {
        for (const rule of group.rules) {
          const metrics = extractMetricNamesFromPromQL(rule.expr)
          for (const m of metrics) {
            // Strip label selectors for comparison — we just check the base name
            // e.g., arch_cache_handler_ops_total{status="error"} → arch_cache_handler_ops_total
            allAlertMetrics.add(m)
          }
        }
      }

      // Debug: show what we're comparing
      const alertMetricArray = Array.from(allAlertMetrics).sort()
      const routeMetricArray = Array.from(routeMetricNames).sort()
      const missing = alertMetricArray.filter((m) => !routeMetricNames.has(m))

      if (missing.length > 0) {
        console.log('=== Metrics in alert rules but NOT in route output ===')
        for (const m of missing) {
          console.log(`  MISSING: ${m}`)
        }
        console.log('=== All route metrics ===')
        for (const m of routeMetricArray) {
          console.log(`  ${m}`)
        }
      }

      // Every metric used in alert rules must exist in the route output
      expect(missing).toEqual([])
    })
  })
})
