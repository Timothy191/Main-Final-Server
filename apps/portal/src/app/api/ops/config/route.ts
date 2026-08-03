import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'

const ALLOWED_KEYS = new Set([
  'NODE_ENV',
  'PORT',
  'REDIS_HOST',
  'REDIS_PORT',
  'CORS_ORIGIN',
  'ENABLE_LOAD_ADAPTIVE_TEST',
  'DISABLE_RATE_LIMIT',
  'OTEL_ENDPOINT',
])

/* ── POST /api/ops/config ───────────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const { keys } = await request.json()
    const keyList: string[] = Array.isArray(keys) ? keys : [...ALLOWED_KEYS]
    const result: Record<string, string | undefined> = {}
    for (const key of keyList) {
      if (ALLOWED_KEYS.has(key)) {
        result[key] = process.env[key]
      }
    }
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
