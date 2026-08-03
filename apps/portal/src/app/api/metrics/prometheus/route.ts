import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getMetrics } from '@/lib/observability/metrics'
import { createAdminClient } from '@repo/supabase/server'

/**
 * @swagger
 * /api/metrics/prometheus:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Exposes Prometheus-compatible metrics for Control Room operations. This endpoint can be scraped by Prometheus server or Grafana for monitoring and alerting.
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
 *       401:
 *         description: Unauthorized - Scrape token mismatch
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Error generating metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

export async function GET(req: NextRequest) {
  try {
    // AGENT-TRACE: Optional token validation for Prometheus scraping security
    const scrapeToken = process.env.METRICS_SCRAPE_TOKEN
    if (scrapeToken) {
      const authHeader = req.headers.get('Authorization')
      const queryToken = req.nextUrl.searchParams.get('token')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken

      if (token !== scrapeToken) {
        return new NextResponse('Unauthorized', {
          status: 401,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      }
    }

    const metrics = await getMetrics()
    const pgvectorMetrics = await getPgVectorMetrics()
    const cacheMetrics = await getCacheHandlerMetricsProxy()
    const redisConnInfo = await getRedisConnectionInfoProxy()

    const lines: string[] = [
      '# HELP arch_job_executions_total Total number of job executions',
      '# TYPE arch_job_executions_total counter',
    ]

    for (const [jobId, entry] of metrics.jobMetrics) {
      lines.push(`arch_job_executions_total{job="${jobId}"} ${entry.count}`)
    }

    lines.push(
      '',
      '# HELP arch_job_errors_total Total number of job errors',
      '# TYPE arch_job_errors_total counter'
    )
    for (const [jobId, entry] of metrics.jobMetrics) {
      lines.push(`arch_job_errors_total{job="${jobId}"} ${entry.errors}`)
    }

    lines.push(
      '',
      '# HELP arch_job_duration_ms_total Total job duration in milliseconds',
      '# TYPE arch_job_duration_ms_total counter'
    )
    for (const [jobId, entry] of metrics.jobMetrics) {
      lines.push(`arch_job_duration_ms_total{job="${jobId}"} ${entry.totalDurationMs}`)
    }

    lines.push(
      '',
      '# HELP arch_db_queries_total Total number of database queries',
      '# TYPE arch_db_queries_total counter'
    )
    for (const [key, entry] of metrics.dbMetrics) {
      const [table, operation] = key.split(':')
      lines.push(`arch_db_queries_total{table="${table}",operation="${operation}"} ${entry.count}`)
    }

    lines.push(
      '',
      '# HELP arch_db_query_errors_total Total number of database query errors',
      '# TYPE arch_db_query_errors_total counter'
    )
    for (const [key, entry] of metrics.dbMetrics) {
      const [table, operation] = key.split(':')
      lines.push(
        `arch_db_query_errors_total{table="${table}",operation="${operation}"} ${entry.errors}`
      )
    }

    lines.push(
      '',
      '# HELP arch_db_query_duration_ms_total Total database query duration in milliseconds',
      '# TYPE arch_db_query_duration_ms_total counter'
    )
    for (const [key, entry] of metrics.dbMetrics) {
      const [table, operation] = key.split(':')
      lines.push(
        `arch_db_query_duration_ms_total{table="${table}",operation="${operation}"} ${entry.totalDurationMs}`
      )
    }

    // -----------------------------------------------------------------------
    // Cache Handler Metrics
    // -----------------------------------------------------------------------
    lines.push(
      '',
      '# HELP arch_cache_handler_ops_total Total cache handler operations by type and status',
      '# TYPE arch_cache_handler_ops_total counter'
    )
    lines.push(`arch_cache_handler_ops_total{operation="get",status="hit"} ${cacheMetrics.getHits}`)
    lines.push(
      `arch_cache_handler_ops_total{operation="get",status="miss"} ${cacheMetrics.getMisses}`
    )
    lines.push(
      `arch_cache_handler_ops_total{operation="get",status="error"} ${cacheMetrics.getErrors}`
    )
    lines.push(
      `arch_cache_handler_ops_total{operation="set",status="error"} ${cacheMetrics.setErrors}`
    )
    lines.push(
      `arch_cache_handler_ops_total{operation="update_tags",status="error"} ${cacheMetrics.updateTagsErrors}`
    )

    lines.push(
      '',
      '# HELP arch_cache_handler_calls_total Total cache handler calls by operation',
      '# TYPE arch_cache_handler_calls_total counter'
    )
    lines.push(`arch_cache_handler_calls_total{operation="get"} ${cacheMetrics.getCalls}`)
    lines.push(`arch_cache_handler_calls_total{operation="set"} ${cacheMetrics.setCalls}`)
    lines.push(
      `arch_cache_handler_calls_total{operation="update_tags"} ${cacheMetrics.updateTagsCalls}`
    )

    lines.push(
      '',
      '# HELP arch_cache_handler_retries_total Total cache handler retry attempts',
      '# TYPE arch_cache_handler_retries_total counter'
    )
    lines.push(`arch_cache_handler_retries_total ${cacheMetrics.retries}`)

    // -----------------------------------------------------------------------
    // Circuit Breaker Metrics
    // -----------------------------------------------------------------------
    lines.push(
      '',
      '# HELP arch_cache_circuit_breaker_events_total Circuit breaker state transitions',
      '# TYPE arch_cache_circuit_breaker_events_total counter'
    )
    lines.push(
      `arch_cache_circuit_breaker_events_total{transition="open"} ${cacheMetrics.circuitBreakerOpens}`
    )
    lines.push(
      `arch_cache_circuit_breaker_events_total{transition="half_open"} ${cacheMetrics.circuitBreakerHalfOpens}`
    )
    lines.push(
      `arch_cache_circuit_breaker_events_total{transition="close"} ${cacheMetrics.circuitBreakerCloses}`
    )
    lines.push(
      `arch_cache_circuit_breaker_events_total{transition="reject"} ${cacheMetrics.circuitBreakerRejects}`
    )

    // -----------------------------------------------------------------------
    // Redis Connection Metrics
    // -----------------------------------------------------------------------
    lines.push(
      '',
      '# HELP arch_redis_connection_info Redis connection state (1=connected, 0=disconnected)',
      '# TYPE arch_redis_connection_info gauge'
    )
    lines.push(
      `arch_redis_connection_info{status="${redisConnInfo.status}"} ${redisConnInfo.connected ? 1 : 0}`
    )
    lines.push(
      '',
      '# HELP arch_redis_native_fallback Whether the native in-memory fallback is active (1=yes, 0=no)',
      '# TYPE arch_redis_native_fallback gauge'
    )
    lines.push(`arch_redis_native_fallback ${redisConnInfo.nativeFallback ? 1 : 0}`)

    // -----------------------------------------------------------------------
    // pgvector metrics
    // -----------------------------------------------------------------------
    lines.push(
      '',
      '# HELP arch_pgvector_hnsw_index_info pgvector HNSW index information',
      '# TYPE arch_pgvector_hnsw_index_info gauge'
    )
    for (const metric of pgvectorMetrics) {
      lines.push(
        `arch_pgvector_hnsw_index_info{index="${metric.index}",table="${metric.table}"} ${metric.exists}`
      )
    }

    lines.push(
      '',
      '# HELP arch_pgvector_hnsw_index_size_bytes HNSW index size in bytes',
      '# TYPE arch_pgvector_hnsw_index_size_bytes gauge'
    )
    for (const metric of pgvectorMetrics) {
      lines.push(
        `arch_pgvector_hnsw_index_size_bytes{index="${metric.index}"} ${metric.indexSizeBytes}`
      )
    }

    lines.push(
      '',
      '# HELP arch_pgvector_hnsw_idxscan_total Total HNSW index scans',
      '# TYPE arch_pgvector_hnsw_idxscan_total counter'
    )
    for (const metric of pgvectorMetrics) {
      lines.push(`arch_pgvector_hnsw_idxscan_total{index="${metric.index}"} ${metric.idxScan}`)
    }

    lines.push(
      '',
      '# HELP arch_pgvector_hnsw_idxtup_returned_total Total tuples returned via HNSW index',
      '# TYPE arch_pgvector_hnsw_idxtup_returned_total counter'
    )
    for (const metric of pgvectorMetrics) {
      lines.push(
        `arch_pgvector_hnsw_idxtup_returned_total{index="${metric.index}"} ${metric.idxTupReturned}`
      )
    }

    const metricsText = lines.join('\n') + '\n'

    return new NextResponse(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    })
  } catch (_error) {
    return new NextResponse('Error generating metrics', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}

/**
 * Proxy to import cache handler metrics — uses dynamic import to avoid
 * ESM resolution issues at module evaluation time.
 */
async function getCacheHandlerMetricsProxy(): Promise<{
  getCalls: number
  getHits: number
  getMisses: number
  getErrors: number
  setCalls: number
  setErrors: number
  updateTagsCalls: number
  updateTagsErrors: number
  retries: number
  circuitBreakerOpens: number
  circuitBreakerHalfOpens: number
  circuitBreakerCloses: number
  circuitBreakerRejects: number
}> {
  try {
    const mod = await import('@/lib/next-cache-handler')
    return mod.getCacheHandlerMetrics?.() ?? getEmptyCacheMetrics()
  } catch {
    return getEmptyCacheMetrics()
  }
}

/** Proxy to import Redis connection info — graceful fallback if module unavailable. */
async function getRedisConnectionInfoProxy(): Promise<{
  connected: boolean
  status: string
  connectionAttempts: number
  nativeFallback: boolean
}> {
  try {
    const mod = (await import('@repo/redis/client')) as {
      getRedisConnectionInfo?: () => {
        connected: boolean
        status: string
        connectionAttempts: number
        nativeFallback: boolean
      }
    }
    return (
      mod.getRedisConnectionInfo?.() ?? {
        connected: false,
        status: 'unavailable',
        connectionAttempts: 0,
        nativeFallback: true,
      }
    )
  } catch {
    return { connected: false, status: 'unavailable', connectionAttempts: 0, nativeFallback: true }
  }
}

function getEmptyCacheMetrics() {
  return {
    getCalls: 0,
    getHits: 0,
    getMisses: 0,
    getErrors: 0,
    setCalls: 0,
    setErrors: 0,
    updateTagsCalls: 0,
    updateTagsErrors: 0,
    retries: 0,
    circuitBreakerOpens: 0,
    circuitBreakerHalfOpens: 0,
    circuitBreakerCloses: 0,
    circuitBreakerRejects: 0,
  }
}

async function getPgVectorMetrics(): Promise<
  Array<{
    index: string
    table: string
    exists: number
    indexSizeBytes: number
    idxScan: number
    idxTupReturned: number
  }>
> {
  const indexes = [
    'idx_memory_embeddings_hnsw',
    'idx_memory_embeddings_hnsw_episodic',
    'idx_memory_embeddings_hnsw_semantic',
  ]

  try {
    const supabase = createAdminClient()

    const { data: indexStats, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          indexrelname as index_name,
          relname as table_name,
          pg_relation_size(indexrelid) as index_size,
          idx_scan,
          idx_tup_returned
        FROM pg_stat_user_indexes
        WHERE indexrelname IN ('${indexes.join("','")}')
      `,
    })

    if (error) {
      return indexes.map((idx) => ({
        index: idx,
        table: 'memory_embeddings',
        exists: 0,
        indexSizeBytes: 0,
        idxScan: 0,
        idxTupReturned: 0,
      }))
    }

    return indexes.map((idx) => {
      const stat = indexStats?.find((s: { index_name: string }) => s.index_name === idx)
      return {
        index: idx,
        table: stat?.table_name ?? 'memory_embeddings',
        exists: stat ? 1 : 0,
        indexSizeBytes: stat?.index_size ?? 0,
        idxScan: stat?.idx_scan ?? 0,
        idxTupReturned: stat?.idx_tup_returned ?? 0,
      }
    })
  } catch {
    return indexes.map((idx) => ({
      index: idx,
      table: 'memory_embeddings',
      exists: 0,
      indexSizeBytes: 0,
      idxScan: 0,
      idxTupReturned: 0,
    }))
  }
}
