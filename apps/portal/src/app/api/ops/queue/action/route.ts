import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { getRedis } from '@repo/redis'

/* ── POST /api/ops/queue/action ─────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { action } = await request.json()
    if (action === 'getJobCounts') {
      const redis = await getRedis()
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
        data: { queue: queueName, waiting, active, completed, failed, delayed },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: `Queue action '${action}' not yet implemented`,
      },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
