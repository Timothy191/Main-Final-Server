/**
 * @jest-environment node
 *
 * Tests for POST /api/cache/invalidate — focused on the `userId` edge-auth
 * eviction path (ADR-001). Asserts the route evicts BOTH cache tiers via
 * `cacheDelete('arch:auth:employee:<userId>')` (L1 + Redis L2), not just L1.
 *
 * Mocks:
 *   - @repo/supabase/server  (createServerSupabaseClient → auth.getUser)
 *   - @repo/redis/cache      (cacheDelete)
 *   - next/cache             (revalidateTag)
 */

import { POST } from './route'

const mockGetUser = jest.fn()
const mockCreateServerSupabaseClient = jest.fn()
const mockCacheDelete = jest.fn()
const mockRevalidateTag = jest.fn()

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: (...args: unknown[]) => mockCreateServerSupabaseClient(...args),
}))

jest.mock('@repo/redis/cache', () => ({
  cacheDelete: (...args: unknown[]) => mockCacheDelete(...args),
}))

jest.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}))

function mockAuthedClient(user: { id: string } | null) {
  mockGetUser.mockResolvedValue({ data: { user } })
  mockCreateServerSupabaseClient.mockResolvedValue({
    auth: { getUser: (...a: unknown[]) => mockGetUser(...a) },
  })
}

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/cache/invalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/cache/invalidate — userId edge-auth eviction (ADR-001)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCacheDelete.mockResolvedValue(undefined)
    mockRevalidateTag.mockResolvedValue(undefined)
  })

  it('evicts BOTH L1 and L2 via cacheDelete(arch:auth:employee:<userId>)', async () => {
    mockAuthedClient({ id: 'admin-uid' })
    const targetUserId = 'target-auth-id'

    const res = await POST(jsonRequest({ userId: targetUserId }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.evictedUserAuth).toBe(targetUserId)
    // The ADR-001 fix: cacheDelete (L1 + redis.del), not cacheEvictL1ByPrefix (L1 only).
    expect(mockCacheDelete).toHaveBeenCalledTimes(1)
    expect(mockCacheDelete).toHaveBeenCalledWith(`arch:auth:employee:${targetUserId}`)
    // userId-only path does not touch the Next.js tag layer.
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('returns 401 when no authenticated session', async () => {
    mockAuthedClient(null)

    const res = await POST(jsonRequest({ userId: 'some-id' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(mockCacheDelete).not.toHaveBeenCalled()
  })

  it('returns 400 when no invalidation target is provided', async () => {
    mockAuthedClient({ id: 'admin-uid' })

    const res = await POST(jsonRequest({}))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/No invalidation target/i)
    expect(mockCacheDelete).not.toHaveBeenCalled()
  })

  it('still succeeds (does not evict user auth) when only tags are provided', async () => {
    mockAuthedClient({ id: 'admin-uid' })

    const res = await POST(jsonRequest({ tags: ['dept:engineering'] }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.evictedUserAuth).toBeUndefined()
    expect(mockCacheDelete).not.toHaveBeenCalled()
  })
})
