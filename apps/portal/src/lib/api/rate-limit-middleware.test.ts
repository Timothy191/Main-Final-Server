/**
 * @jest-environment node
 */

import { withRateLimit, skipForInternal } from './rate-limit-middleware'
import { NextRequest, NextResponse } from 'next/server'

const mockCache = new Map<string, string>()

const mockRedisClient = {
  get: jest.fn(async (key: string) => mockCache.get(key) ?? null),
  set: jest.fn(async (key: string, value: string) => {
    mockCache.set(key, value)
  }),
  del: jest.fn(async (key: string) => {
    mockCache.delete(key)
  }),
  incr: jest.fn(async (key: string) => {
    const val = parseInt(mockCache.get(key) || '0', 10) + 1
    mockCache.set(key, val.toString())
    return val
  }),
  expire: jest.fn(async (_key: string, _seconds: number) => {
    return true
  }),
}

jest.mock('@repo/redis', () => ({
  getRedisClient: jest.fn(async () => mockRedisClient),
}))

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, { headers })
}

const handler = jest.fn(async () => NextResponse.json({ ok: true }))

describe('withRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCache.clear()
    handler.mockResolvedValue(NextResponse.json({ ok: true }))
  })

  it('allows the first request and adds rate limit headers', async () => {
    const req = makeRequest('http://localhost/api/export/machines')
    const res = await withRateLimit(req, handler)

    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy()
    expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('blocks requests when limit is exceeded and does not call handler', async () => {
    const req = makeRequest('http://localhost/api/ai/chat', {
      'x-forwarded-for': '10.0.0.1',
    })

    // Exhaust the AI limit (30 req/min)
    for (let i = 0; i < 30; i++) {
      await withRateLimit(
        makeRequest('http://localhost/api/ai/chat', {
          'x-forwarded-for': '10.0.0.1',
        }),
        handler
      )
    }

    handler.mockClear()
    const blockedRes = await withRateLimit(req, handler)

    expect(blockedRes.status).toBe(429)
    expect(handler).not.toHaveBeenCalled()
    const body = await blockedRes.json()
    expect(body.error).toBe('Rate limit exceeded')
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy()
  })

  it('returns 429 headers without calling handler when rate limited', async () => {
    const customLimit = { windowMs: 60_000, maxRequests: 1 }
    const req = makeRequest('http://localhost/api/test', {
      'x-forwarded-for': '10.0.0.2',
    })

    await withRateLimit(req, handler, { customLimit })
    handler.mockClear()

    const res = await withRateLimit(
      makeRequest('http://localhost/api/test', {
        'x-forwarded-for': '10.0.0.2',
      }),
      handler,
      { customLimit }
    )

    expect(res.status).toBe(429)
    expect(handler).not.toHaveBeenCalled()
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('skips rate limiting when skipIf returns true', async () => {
    const customLimit = { windowMs: 60_000, maxRequests: 0 }
    const req = makeRequest('http://localhost/api/test')

    const res = await withRateLimit(req, handler, {
      customLimit,
      skipIf: () => true,
    })

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('uses user ID as identifier when x-user-id header is set', async () => {
    const req1 = makeRequest('http://localhost/api/ai/chat', {
      'x-user-id': 'user-abc',
    })
    const req2 = makeRequest('http://localhost/api/ai/chat', {
      'x-user-id': 'user-xyz',
    })

    const customLimit = { windowMs: 60_000, maxRequests: 1 }

    await withRateLimit(req1, handler, { customLimit })
    handler.mockClear()

    // Different user should not be blocked
    const res = await withRateLimit(req2, handler, { customLimit })
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('bypasses rate limiting for whitelisted IPs', async () => {
    const req = makeRequest('http://localhost/api/export/machines', {
      'x-forwarded-for': '127.0.0.1',
    })
    const res = await withRateLimit(req, handler)

    expect(res.status).toBe(200)
    expect(res.headers.get('X-RateLimit-Limit')).toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('halves request limits when system is under high load', async () => {
    process.env.ENABLE_LOAD_ADAPTIVE_TEST = 'true'
    const os = require('os')
    const originalLoadavg = os.loadavg
    const originalCpus = os.cpus

    // Mock high CPU load: 4 CPUs, load average of 8.0 (200% utilization)
    os.loadavg = () => [8.0, 8.0, 8.0]
    os.cpus = () => Array(4).fill({})

    const req = makeRequest('http://localhost/api/export/machines', {
      'x-forwarded-for': '10.0.0.99',
    })
    const customLimit = { windowMs: 60_000, maxRequests: 10 }
    const res = await withRateLimit(req, handler, { customLimit })

    expect(res.status).toBe(200)
    // Limit of 10 should be halved to 5
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5')

    // Restore original functions
    os.loadavg = originalLoadavg
    os.cpus = originalCpus
    delete process.env.ENABLE_LOAD_ADAPTIVE_TEST
  })
})

describe('skipForInternal', () => {
  const originalEnv = process.env.INTERNAL_API_SECRET

  beforeAll(() => {
    process.env.INTERNAL_API_SECRET = 'test-secret-123'
  })

  afterAll(() => {
    process.env.INTERNAL_API_SECRET = originalEnv
  })

  it('returns true when secret matches', () => {
    const req = makeRequest('http://localhost/api/sync/playback', {
      'x-internal-secret': 'test-secret-123',
    })
    expect(skipForInternal(req)).toBe(true)
  })

  it('returns false when secret does not match', () => {
    const req = makeRequest('http://localhost/api/sync/playback', {
      'x-internal-secret': 'wrong-secret',
    })
    expect(skipForInternal(req)).toBe(false)
  })
})
