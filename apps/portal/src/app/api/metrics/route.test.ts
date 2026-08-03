/**
 * @jest-environment node
 */
import { GET } from './route'
import {
  recordJobExecution,
  recordDbQuery,
  clearObservabilityMetrics,
} from '@/lib/observability/metrics'

// Mock @repo/redis stats
jest.mock('@repo/redis', () => ({
  getCacheStats: jest.fn().mockResolvedValue({
    hits: 40,
    misses: 10,
    l1Hits: 25,
    l2Hits: 15,
    redisErrors: 0,
    avgLatencyMs: 4.5,
    p95LatencyMs: 12.2,
  }),
}))

describe('GET /api/metrics', () => {
  beforeEach(() => {
    clearObservabilityMetrics()
  })

  it('returns cache, job, and query metrics in Prometheus text format', async () => {
    // Record mock Inngest job execution
    recordJobExecution('test-job', 150.5, true)
    recordJobExecution('test-job', 200, false)

    // Record mock DB query execution
    recordDbQuery('machines', 'SELECT', 45.2, true)
    recordDbQuery('machines', 'SELECT', 80, false)

    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')

    const text = await res.text()

    // 1. Verify cache metrics
    expect(text).toContain('portal_cache_hits_total{source="l1"} 25')
    expect(text).toContain('portal_cache_hits_total{source="l2"} 15')
    expect(text).toContain('portal_cache_misses_total 10')
    expect(text).toContain('portal_cache_latency_ms{metric="avg"} 4.5')
    expect(text).toContain('portal_cache_latency_ms{metric="p95"} 12.2')

    // 2. Verify Inngest job metrics
    expect(text).toContain('portal_inngest_job_executions_total{job_id="test-job"} 2')
    expect(text).toContain('portal_inngest_job_errors_total{job_id="test-job"} 1')
    expect(text).toContain('portal_inngest_job_duration_ms_total{job_id="test-job"} 350.5')

    // 3. Verify DB query metrics
    expect(text).toContain(
      'portal_db_query_executions_total{table="machines",operation="SELECT"} 2'
    )
    expect(text).toContain('portal_db_query_errors_total{table="machines",operation="SELECT"} 1')
    expect(text).toContain(
      'portal_db_query_duration_ms_total{table="machines",operation="SELECT"} 125.2'
    )
  })
})
