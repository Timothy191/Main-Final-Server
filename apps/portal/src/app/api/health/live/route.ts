import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { withLogging } from '@repo/logger/next'

export const GET = withLogging(
  async (_req: NextRequest, _context: { params: Promise<unknown> }) => {
    const startedAt = Date.now()
    const degraded = false

    return NextResponse.json(
      {
        status: degraded ? 'degraded' : 'healthy',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: degraded ? 503 : 200 }
    )
  }
)
