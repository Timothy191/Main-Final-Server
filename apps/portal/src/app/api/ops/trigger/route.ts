import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { getRedis, getNativeEventBus } from '@repo/redis'

/* ── POST /api/ops/trigger ──────────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { triggerType, severity, context } = await request.json()
    if (!triggerType) {
      return NextResponse.json({ error: 'triggerType is required' }, { status: 400 })
    }

    const eventBus = getNativeEventBus()
    const event = await eventBus.emit(triggerType, 'ops-module', context ?? {})

    const redis = await getRedis()
    const payload = {
      triggerType,
      severity: severity ?? 'info',
      context: context ?? {},
      source: 'ops-module',
      timestamp: new Date().toISOString(),
    }

    const streamId = await redis.xadd('agent:triggers', '*', 'payload', JSON.stringify(payload))

    return NextResponse.json({
      success: true,
      data: { queued: true, streamId, eventId: event.id },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        data: { queued: false, streamId: null },
        error: message,
      },
      { status: 500 }
    )
  }
}
