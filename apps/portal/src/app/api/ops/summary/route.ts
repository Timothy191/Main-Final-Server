import { NextResponse } from 'next/server'
import { getRedis } from '@repo/redis'
import { requireAdmin } from '@/lib/api/auth'

/* ── GET /api/ops/summary ───────────────────────────────────── */
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const redis = await getRedis()
    let cacheHitRate: number | null = null
    try {
      const hits = await redis.get('ops:cache:hits')
      const misses = await redis.get('ops:cache:misses')
      if (hits !== null && misses !== null) {
        const total = Number(hits) + Number(misses)
        cacheHitRate = total > 0 ? Number(hits) / total : null
      }
    } catch {
      // cache stats unavailable
    }

    const queueName = 'background-tasks'
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      redis.llen(`bull:${queueName}:wait`).catch(() => 0),
      redis.llen(`bull:${queueName}:active`).catch(() => 0),
      redis.llen(`bull:${queueName}:completed`).catch(() => 0),
      redis.llen(`bull:${queueName}:failed`).catch(() => 0),
      redis.llen(`bull:${queueName}:delayed`).catch(() => 0),
    ])

    return NextResponse.json({
      success: true,
      data: {
        healthy: true,
        cacheHitRate,
        queue: { queue: queueName, waiting, active, completed, failed, delayed },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
