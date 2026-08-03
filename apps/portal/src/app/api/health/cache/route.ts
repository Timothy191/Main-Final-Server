/**
 * @swagger
 * /api/health/cache:
 *   get:
 *     summary: Cache health check with circuit breaker diagnostics
 *     description: >-
 *       Returns cache statistics including hit rate, hits, misses, Redis connection status,
 *       circuit breaker state, and recent audit log events from the cross-pod
 *       circuit breaker audit log. Monitors the performance and resilience of the
 *       caching layer.
 *     tags:
 *       - Health
 *       - Cache
 *     responses:
 *       200:
 *         description: Cache health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded]
 *                 hitRate:
 *                   type: number
 *                   description: Cache hit rate (0-1)
 *                 hits:
 *                   type: integer
 *                 misses:
 *                   type: integer
 *                 redis:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                     connectionAttempts:
 *                       type: integer
 *                     nativeFallback:
 *                       type: boolean
 *                 circuitBreaker:
 *                   type: object
 *                   properties:
 *                     state:
 *                       type: string
 *                       enum: [CLOSED, OPEN, HALF_OPEN]
 *                     failureCount:
 *                       type: integer
 *                     opens:
 *                       type: integer
 *                     halfOpens:
 *                       type: integer
 *                     closes:
 *                       type: integer
 *                     rejects:
 *                       type: integer
 *                 auditEvents:
 *                   type: array
 *                   description: Recent circuit breaker audit log events (up to 10)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
import { NextResponse } from 'next/server'
import { getCacheStats, getRedisClient } from '@repo/redis'

export async function GET() {
  const stats = await getCacheStats()
  const cacheHandlerInfo = await getCacheHandlerDiagnostics()
  const recentAuditEvents = await getRecentAuditEvents()
  let redisClient: { status?: string } | null = null

  try {
    redisClient = await getRedisClient()
  } catch {
    // Redis not available
  }

  const redisConnected = redisClient?.status === 'ready' || !!redisClient

  const total = stats.hits + stats.misses
  const hitRate = total > 0 ? Math.round((stats.hits / total) * 10000) / 10000 : 0

  return NextResponse.json({
    status:
      redisConnected && cacheHandlerInfo.circuitBreaker.state === 'CLOSED' ? 'healthy' : 'degraded',
    hitRate,
    hits: stats.hits,
    misses: stats.misses,
    redisErrors: stats.redisErrors,
    redis: {
      connected: redisConnected,
      ...cacheHandlerInfo.redisConnection,
    },
    circuitBreaker: cacheHandlerInfo.circuitBreaker,
    retries: cacheHandlerInfo.retries,
    auditEvents: recentAuditEvents,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Fetch cache handler diagnostics via dynamic import proxy.
 * Gracefully falls back to default values if the handler module is unavailable.
 */
async function getCacheHandlerDiagnostics(): Promise<{
  circuitBreaker: {
    state: string
    failureCount: number
    opens: number
    halfOpens: number
    closes: number
    rejects: number
  }
  redisConnection: {
    status: string
    connectionAttempts: number
    nativeFallback: boolean
  }
  retries: number
}> {
  const defaults = {
    circuitBreaker: {
      state: 'unavailable',
      failureCount: 0,
      opens: 0,
      halfOpens: 0,
      closes: 0,
      rejects: 0,
    },
    redisConnection: {
      status: 'unknown',
      connectionAttempts: 0,
      nativeFallback: true,
    },
    retries: 0,
  }

  try {
    const cacheHandler = await import('@/lib/next-cache-handler')
    const metrics = cacheHandler.getCacheHandlerMetrics?.() ?? {}
    const breakerState = cacheHandler.getCircuitBreakerState?.() ?? 'unavailable'

    // Redis connection info from @repo/redis/client
    let redisConn = { status: 'unknown', connectionAttempts: 0, nativeFallback: true }
    try {
      const redisModule = (await import('@repo/redis/client')) as {
        getRedisConnectionInfo?: () => {
          status: string
          connectionAttempts: number
          nativeFallback: boolean
        }
      }
      redisConn = redisModule.getRedisConnectionInfo?.() ?? redisConn
    } catch {
      // Fallback
    }

    return {
      circuitBreaker: {
        state: breakerState,
        failureCount: metrics.circuitBreakerOpens ?? 0,
        opens: metrics.circuitBreakerOpens ?? 0,
        halfOpens: metrics.circuitBreakerHalfOpens ?? 0,
        closes: metrics.circuitBreakerCloses ?? 0,
        rejects: metrics.circuitBreakerRejects ?? 0,
      },
      redisConnection: redisConn,
      retries: metrics.retries ?? 0,
    }
  } catch {
    return defaults
  }
}

/**
 * Fetch recent audit events from the Redis audit log list.
 * Uses LRANGE to get the most recent 10 entries.
 * Gracefully falls back to empty array if Redis is unavailable.
 */
async function getRecentAuditEvents(): Promise<Array<Record<string, unknown>>> {
  try {
    const redis = await getRedisClient()
    if (!redis || typeof redis.lrange !== 'function') return []

    const entries = await redis.lrange('arch:circuit-breaker:audit', 0, 9)
    if (!entries || !Array.isArray(entries)) return []

    return entries
      .map((entry: string) => {
        try {
          return JSON.parse(entry) as Record<string, unknown>
        } catch {
          return null
        }
      })
      .filter(Boolean) as Array<Record<string, unknown>>
  } catch {
    return []
  }
}
