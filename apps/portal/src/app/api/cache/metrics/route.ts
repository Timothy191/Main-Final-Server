import { NextResponse } from 'next/server'
import { getCacheStats } from '@repo/redis/stats'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { AppError } from '@/lib/errors/error-classes'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppError('Unauthorized', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access cache telemetry',
      })
    }

    const stats = await getCacheStats()
    const total = stats.hits + stats.misses
    const hitRatio = total > 0 ? (stats.hits / total) * 100 : 0
    const l1Ratio = stats.hits > 0 ? (stats.l1Hits / stats.hits) * 100 : 0
    const l2Ratio = stats.hits > 0 ? (stats.l2Hits / stats.hits) * 100 : 0

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: total,
        hitRatioPercent: Math.round(hitRatio * 100) / 100,
        l1HitRatioPercent: Math.round(l1Ratio * 100) / 100,
        l2HitRatioPercent: Math.round(l2Ratio * 100) / 100,
      },
      raw: stats,
    })
  } catch (error) {
    const err = error as Error & { code?: string; statusCode?: number }
    return NextResponse.json(
      {
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
      },
      { status: err.statusCode || 500 }
    )
  }
}
