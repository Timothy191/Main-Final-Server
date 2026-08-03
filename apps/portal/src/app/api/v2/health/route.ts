import { NextResponse } from 'next/server'
import { db } from '@repo/database'
import Redis from 'ioredis'

// Initialize Redis client (mirroring NestJS pattern)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function GET() {
  const startedAt = Date.now()
  const checks: Record<string, unknown> = {}
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  // 1. Database Check
  try {
    await db.selectFrom('employees').select('id').limit(1).execute()
    checks.database = { status: 'healthy' }
  } catch (err: unknown) {
    checks.database = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : String(err),
    }
    status = 'unhealthy'
  }

  // 2. Redis Check
  try {
    const isReady = redis.status === 'ready'
    let redisConnected = isReady
    if (!isReady) {
      const pong = await redis.ping()
      redisConnected = pong === 'PONG'
    }
    checks.redis = {
      status: redisConnected ? 'healthy' : 'degraded',
      connected: redisConnected,
    }
    if (!redisConnected && status !== 'unhealthy') {
      status = 'degraded'
    }
  } catch (err: unknown) {
    checks.redis = { status: 'unhealthy', error: err instanceof Error ? err.message : String(err) }
    status = 'unhealthy'
  }

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    checks,
  })
}

export async function POST() {
  return new NextResponse(null, { status: 405 })
}
