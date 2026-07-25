import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  const startedAt = Date.now()
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  let connected = false
  let error: string | null = null

  try {
    const realtimeUrl = new URL('/realtime/v1/health', process.env.NEXT_PUBLIC_SUPABASE_URL)

    const response = await fetch(realtimeUrl.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: 'application/json',
      },
    })

    connected = response.ok
    if (!connected) {
      status = response.status >= 500 ? 'unhealthy' : 'degraded'
      error = `Supabase Realtime returned ${response.status}`
    }
  } catch (err: unknown) {
    status = 'unhealthy'
    connected = false
    error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(
    {
      status,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      connected,
      error,
    },
    { status: status === 'unhealthy' ? 503 : status === 'degraded' ? 200 : 200 }
  )
}
