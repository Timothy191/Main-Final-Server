/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Portal metrics (Prometheus format)
 *     description: Exposes Prometheus-compatible metrics including cache performance, Inngest job executions, and database query statistics. For use with Prometheus or Grafana.
 *     tags:
 *       - Metrics
 *     responses:
 *       200:
 *         description: Prometheus metrics in text format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Prometheus metrics exposition format
 */
import { getCacheStats } from '@repo/redis'
import { getObservabilityMetrics } from '@/lib/observability/metrics'

export async function GET() {
  const cacheStats = await getCacheStats()
  const { jobMetrics, dbMetrics } = await getObservabilityMetrics()
  let body = ''

  // 1. Cache Metrics
  body += `# HELP portal_cache_hits_total Cumulative number of cache hits.
# TYPE portal_cache_hits_total counter
portal_cache_hits_total{source="l1"} ${cacheStats.l1Hits}
portal_cache_hits_total{source="l2"} ${cacheStats.l2Hits}

# HELP portal_cache_misses_total Cumulative number of cache misses.
# TYPE portal_cache_misses_total counter
portal_cache_misses_total ${cacheStats.misses}

# HELP portal_cache_errors_total Cumulative number of Redis cache errors.
# TYPE portal_cache_errors_total counter
portal_cache_errors_total ${cacheStats.redisErrors}

# HELP portal_cache_latency_ms Average latency of cache accesses in milliseconds.
# TYPE portal_cache_latency_ms gauge
portal_cache_latency_ms{metric="avg"} ${cacheStats.avgLatencyMs}
portal_cache_latency_ms{metric="p95"} ${cacheStats.p95LatencyMs}

`

  // 2. Inngest Job Metrics
  body += `# HELP portal_inngest_job_executions_total Total number of Inngest job executions.
# TYPE portal_inngest_job_executions_total counter
`
  for (const [jobId, entry] of jobMetrics.entries()) {
    body += `portal_inngest_job_executions_total{job_id="${jobId}"} ${entry.count}\n`
  }
  body += `\n`

  body += `# HELP portal_inngest_job_errors_total Total number of Inngest job execution errors.
# TYPE portal_inngest_job_errors_total counter
`
  for (const [jobId, entry] of jobMetrics.entries()) {
    body += `portal_inngest_job_errors_total{job_id="${jobId}"} ${entry.errors}\n`
  }
  body += `\n`

  body += `# HELP portal_inngest_job_duration_ms_total Cumulative duration of Inngest job executions in milliseconds.
# TYPE portal_inngest_job_duration_ms_total counter
`
  for (const [jobId, entry] of jobMetrics.entries()) {
    body += `portal_inngest_job_duration_ms_total{job_id="${jobId}"} ${Math.round(entry.totalDurationMs * 100) / 100}\n`
  }
  body += `\n`

  // 3. Database Query Metrics
  body += `# HELP portal_db_query_executions_total Total number of database query executions.
# TYPE portal_db_query_executions_total counter
`
  for (const [key, entry] of dbMetrics.entries()) {
    const [tableName, operation] = key.split(':')
    body += `portal_db_query_executions_total{table="${tableName}",operation="${operation}"} ${entry.count}\n`
  }
  body += `\n`

  body += `# HELP portal_db_query_errors_total Total number of database query errors.
# TYPE portal_db_query_errors_total counter
`
  for (const [key, entry] of dbMetrics.entries()) {
    const [tableName, operation] = key.split(':')
    body += `portal_db_query_errors_total{table="${tableName}",operation="${operation}"} ${entry.errors}\n`
  }
  body += `\n`

  body += `# HELP portal_db_query_duration_ms_total Cumulative duration of database queries in milliseconds.
# TYPE portal_db_query_duration_ms_total counter
`
  for (const [key, entry] of dbMetrics.entries()) {
    const [tableName, operation] = key.split(':')
    body += `portal_db_query_duration_ms_total{table="${tableName}",operation="${operation}"} ${Math.round(entry.totalDurationMs * 100) / 100}\n`
  }
  body += `\n`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
