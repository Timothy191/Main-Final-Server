import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { getRedis } from '@repo/redis'

/* ── POST /api/ops/cache/clear ──────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { pattern = '*' } = await request.json()
    const redis = await getRedis()
    let cleared = 0
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
        cleared += keys.length
      }
    } while (cursor !== '0')

    return NextResponse.json({ success: true, data: { cleared } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
