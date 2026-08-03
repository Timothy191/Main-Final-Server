export interface MetricEntry {
  count: number
  errors: number
  totalDurationMs: number
}

interface ObservabilityMetrics {
  jobMetrics: Map<string, MetricEntry>
  dbMetrics: Map<string, MetricEntry>
}

// In-memory metric store
const jobMetrics = new Map<string, MetricEntry>()
const dbMetrics = new Map<string, MetricEntry>()

export function incrementMetric(_name: string, _value: number = 1) {
  // Stub implementation
}

export function recordMetric(_name: string, _value: number) {
  // Stub implementation
}

export function recordJobExecution(jobId: string, durationMs: number, success: boolean) {
  const entry = jobMetrics.get(jobId) ?? { count: 0, errors: 0, totalDurationMs: 0 }
  entry.count++
  if (!success) entry.errors++
  entry.totalDurationMs += durationMs
  jobMetrics.set(jobId, entry)
}

export function recordDbQuery(
  table: string,
  operation = 'SELECT',
  durationMs: number,
  success: boolean
) {
  const key = `${table}:${operation}`
  const entry = dbMetrics.get(key) ?? { count: 0, errors: 0, totalDurationMs: 0 }
  entry.count++
  if (!success) entry.errors++
  entry.totalDurationMs += durationMs
  dbMetrics.set(key, entry)
}

export async function getObservabilityMetrics(): Promise<ObservabilityMetrics> {
  return {
    jobMetrics: new Map(jobMetrics),
    dbMetrics: new Map(dbMetrics),
  }
}

export function clearObservabilityMetrics(): void {
  jobMetrics.clear()
  dbMetrics.clear()
}

/** @deprecated Use getObservabilityMetrics */
export const getMetrics = getObservabilityMetrics
