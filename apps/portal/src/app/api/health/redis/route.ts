import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getRedisClient } from '@repo/redis/client'

export async function GET(_req: NextRequest) {
  const startedAt = Date.now()

  try {
    const redis = await getRedisClient()
    let connected = redis.status === 'ready'
    if (!connected) {
      const pong = await redis.ping()
      connected = pong === 'PONG'
    }

    return NextResponse.json(
      {
        status: connected ? 'healthy' : 'degraded',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        connected,
      },
      { status: connected ? 200 : 503 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        connected: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }
}
