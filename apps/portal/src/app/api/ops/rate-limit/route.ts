import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { getRedis } from '@repo/redis'

/* ── POST /api/ops/rate-limit ───────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { limit } = await request.json()
    if (typeof limit !== 'number' || limit < 1) {
      return NextResponse.json({ error: 'limit must be a positive number' }, { status: 400 })
    }
    const redis = await getRedis()
    await redis.set('ops:rate-limit-override', limit.toString())
    return NextResponse.json({ success: true, data: { limit } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
