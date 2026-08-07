/**
 * @jest-environment node
 */

import { GET } from './route'
import { getCacheStats } from '@repo/redis/stats'
import { requireAdmin } from '@/lib/api/auth'
import { NextResponse } from 'next/server'

jest.mock('@repo/redis/stats', () => ({
  getCacheStats: jest.fn(),
}))

jest.mock('@/lib/api/auth', () => ({
  requireAdmin: jest.fn(),
}))

const mockGetCacheStats = getCacheStats as jest.Mock
const mockRequireAdmin = requireAdmin as jest.Mock

describe('GET /api/metrics/cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401/403 error if requireAdmin returns an error', async () => {
    const errorResponse = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    mockRequireAdmin.mockResolvedValue({ error: errorResponse })

    const res = await GET()
    expect(res).toBe(errorResponse)
    expect(mockGetCacheStats).not.toHaveBeenCalled()
  })

  it('returns cache stats as JSON when user is admin', async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: {}, user: { id: 'admin-id' } })
    const statsData = {
      hits: 150,
      misses: 45,
      l1Hits: 100,
      l2Hits: 50,
      redisErrors: 1,
      avgLatencyMs: 2.5,
      p95LatencyMs: 12.0,
    }
    mockGetCacheStats.mockResolvedValue(statsData)

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual(statsData)
    expect(mockGetCacheStats).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when getCacheStats throws an error', async () => {
    mockRequireAdmin.mockResolvedValue({ supabase: {}, user: { id: 'admin-id' } })
    mockGetCacheStats.mockRejectedValue(new Error('Redis connection failed'))

    const res = await GET()
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toBe('Redis connection failed')
  })
})
