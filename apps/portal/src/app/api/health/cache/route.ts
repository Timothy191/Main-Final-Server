/**
 * @swagger
 * /api/health/cache:
 *   get:
 *     summary: Cache health check
 *     description: Returns cache statistics including hit rate, hits, misses, and Redis connection status. Monitors the performance of the caching layer used for department slug resolution.
 *     tags:
 *       - Health
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
 *                 redisConnected:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
import { NextResponse } from 'next/server'
import { getCacheStats, getRedisClient } from '@repo/redis'

export async function GET() {
  const stats = await getCacheStats()
  let redisConnected = false
  try {
    const redis = await getRedisClient()
    redisConnected = (redis as unknown as Record<string, boolean>).isOpen ?? false
  } catch {
    // Redis not available
  }

  const total = stats.hits + stats.misses
  const hitRate = total > 0 ? Math.round((stats.hits / total) * 10000) / 10000 : 0

  return NextResponse.json({
    status: redisConnected ? 'healthy' : 'degraded',
    hitRate,
    ...stats,
    redisConnected,
    timestamp: new Date().toISOString(),
  })
}
