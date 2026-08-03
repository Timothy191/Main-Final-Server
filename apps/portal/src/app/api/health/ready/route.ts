/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness health check
 *     description: >
 *       Kubernetes-style readiness probe that verifies the portal can serve
 *       traffic by checking all external dependencies (Supabase/Postgres,
 *       Redis). Unlike the liveness endpoint (/api/health/live) which only
 *       confirms the process is alive, this endpoint ensures the entire
 *       dependency graph is reachable.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: All dependencies healthy — ready to serve traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ready, not_ready]
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     redis:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                 latencyMs:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: One or more dependencies are unhealthy — not ready
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { getRedisClient } from '@repo/redis'

interface DependencyStatus {
  database: 'healthy' | 'degraded' | 'unhealthy'
  redis: 'healthy' | 'degraded' | 'unhealthy'
}

export async function GET() {
  const startedAt = Date.now()
  const dependencies: DependencyStatus = {
    database: 'unhealthy',
    redis: 'unhealthy',
  }

  // Check Supabase / PostgreSQL
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('employees').select('role').limit(1)
    dependencies.database = error ? 'degraded' : 'healthy'
  } catch {
    dependencies.database = 'unhealthy'
  }

  // Check Redis
  try {
    const redis = getRedisClient()
    let connected = redis.status === 'ready'
    if (!connected) {
      const pong = await redis.ping()
      connected = pong === 'PONG'
    }
    dependencies.redis = connected ? 'healthy' : 'degraded'
  } catch {
    dependencies.redis = 'unhealthy'
  }

  const allHealthy = dependencies.database === 'healthy' && dependencies.redis === 'healthy'
  const anyUnhealthy = dependencies.database === 'unhealthy' || dependencies.redis === 'unhealthy'

  const status: 'ready' | 'not_ready' = anyUnhealthy
    ? 'not_ready'
    : allHealthy
      ? 'ready'
      : 'not_ready'

  return NextResponse.json(
    {
      status,
      dependencies,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ready' ? 200 : 503 }
  )
}
