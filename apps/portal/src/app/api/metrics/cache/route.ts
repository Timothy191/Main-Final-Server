import { NextResponse } from 'next/server'
import { getCacheStats } from '@repo/redis/stats'
import { requireAdmin } from '@/lib/api/auth'

export async function GET(): Promise<NextResponse> {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return auth.error
  }

  try {
    const stats = await getCacheStats()
    return NextResponse.json(stats)
  } catch (error) {
    const err = error as Error
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
