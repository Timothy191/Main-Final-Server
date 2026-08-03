/**
 * @jest-environment node
 *
 * Tests for GET /api/health/cache — Cache health check with circuit breaker
 * diagnostics, Redis connection status, and audit log events.
 *
 * Mocks:
 *   - @repo/redis          (getCacheStats, getRedisClient)
 *   - @/lib/next-cache-handler  (dynamic import in getCacheHandlerDiagnostics)
 *   - @repo/redis/client   (dynamic import for getRedisConnectionInfo)
 */

import { GET } from './route'

// ---------------------------------------------------------------------------
// Mock references — use captured jest.fn() so we can change returns per test
// ---------------------------------------------------------------------------
const mockGetCacheStats = jest.fn()
const mockGetRedisClient = jest.fn()
const mockGetCacheHandlerMetrics = jest.fn()
const mockGetCircuitBreakerState = jest.fn()
const mockGetRedisConnectionInfo = jest.fn()

jest.mock('@repo/redis', () => ({
  getCacheStats: (...args: unknown[]) => mockGetCacheStats(...args),
  getRedisClient: (...args: unknown[]) => mockGetRedisClient(...args),
}))

jest.mock('@/lib/next-cache-handler', () => ({
  getCacheHandlerMetrics: (...args: unknown[]) => mockGetCacheHandlerMetrics(...args),
  getCircuitBreakerState: (...args: unknown[]) => mockGetCircuitBreakerState(...args),
}))

jest.mock('@repo/redis/client', () => ({
  getRedisConnectionInfo: (...args: unknown[]) => mockGetRedisConnectionInfo(...args),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRedisClient(status = 'ready', lrangeResult: string[] = []) {
  return {
    status,
    lrange: jest.fn().mockResolvedValue(lrangeResult),
    ping: jest.fn().mockResolvedValue('PONG'),
  }
}

function healthyMetrics() {
  return {
    circuitBreakerOpens: 0,
    circuitBreakerHalfOpens: 0,
    circuitBreakerCloses: 1,
    circuitBreakerRejects: 0,
    retries: 0,
  }
}

function healthyRedisConnInfo() {
  return {
    status: 'ready',
    connectionAttempts: 1,
    nativeFallback: false,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/health/cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Healthy state
  // -----------------------------------------------------------------------

  it('returns healthy status when Redis is connected and CB is CLOSED', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 100, misses: 20, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready'))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.hitRate).toBeCloseTo(0.8333, 3)
    expect(body.hits).toBe(100)
    expect(body.misses).toBe(20)
    expect(body.redis.connected).toBe(true)
    expect(body.redis.status).toBe('ready')
    expect(body.redis.nativeFallback).toBe(false)
    expect(body.redis.connectionAttempts).toBe(1)
    expect(body.circuitBreaker.state).toBe('CLOSED')
    expect(body.circuitBreaker.opens).toBe(0)
    expect(body.circuitBreaker.rejects).toBe(0)
    expect(body.retries).toBe(0)
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('auditEvents')
  })

  it('returns hitRate=0 when there are no cache operations', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 0, misses: 0, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready'))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(body.hitRate).toBe(0)
    expect(body.status).toBe('healthy')
  })

  // -----------------------------------------------------------------------
  // Degraded — circuit breaker OPEN
  // -----------------------------------------------------------------------

  it('returns status=degraded when circuit breaker is OPEN (Redis connected)', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 50, misses: 10, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready'))
    mockGetCircuitBreakerState.mockReturnValue('OPEN')
    mockGetCacheHandlerMetrics.mockReturnValue({
      circuitBreakerOpens: 3,
      circuitBreakerHalfOpens: 1,
      circuitBreakerCloses: 0,
      circuitBreakerRejects: 15,
      retries: 8,
    })
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(body.status).toBe('degraded')
    expect(body.redis.connected).toBe(true)
    expect(body.circuitBreaker.state).toBe('OPEN')
    expect(body.circuitBreaker.opens).toBe(3)
    expect(body.circuitBreaker.halfOpens).toBe(1)
    expect(body.circuitBreaker.closes).toBe(0)
    expect(body.circuitBreaker.rejects).toBe(15)
    expect(body.retries).toBe(8)
  })

  // -----------------------------------------------------------------------
  // Degraded — Redis unavailable
  // -----------------------------------------------------------------------

  it('returns status=degraded when Redis client throws (connection failure)', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 5, misses: 2, redisErrors: 3 })
    mockGetRedisClient.mockRejectedValue(new Error('Connection refused'))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(body.status).toBe('degraded')
    expect(body.redis.connected).toBe(false)
  })

  // -----------------------------------------------------------------------
  // Fallback — cache handler dynamic import fails
  // -----------------------------------------------------------------------

  it('returns fallback defaults when cache handler functions return undefined', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 10, misses: 5, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready'))

    // Simulate the dynamic import succeeding but exports being undefined
    // This exercises the ?? fallback for getCacheHandlerMetrics and getCircuitBreakerState
    mockGetCircuitBreakerState.mockReturnValue(undefined)
    mockGetCacheHandlerMetrics.mockReturnValue(undefined)
    mockGetRedisConnectionInfo.mockReturnValue(undefined)

    const res = await GET()
    const body = await res.json()

    // State is 'unavailable' which is not 'CLOSED' → degraded
    expect(body.status).toBe('degraded')
    expect(body.circuitBreaker.state).toBe('unavailable')
    expect(body.circuitBreaker.opens).toBe(0)
    expect(body.circuitBreaker.failureCount).toBe(0)
    expect(body.redis.connected).toBe(true)
    // When getRedisConnectionInfo returns undefined, the spread keeps defaults
    // from the fallback path inside getCacheHandlerDiagnostics
  })

  // -----------------------------------------------------------------------
  // Audit events
  // -----------------------------------------------------------------------

  it('includes audit events from Redis LRANGE', async () => {
    const auditEvents = [
      JSON.stringify({
        state: 'OPEN',
        podId: 'pod-1',
        timestamp: Date.now() - 5000,
        failureCount: 5,
      }),
      JSON.stringify({
        state: 'HALF_OPEN',
        podId: 'pod-1',
        timestamp: Date.now() - 3000,
        failureCount: 3,
      }),
      JSON.stringify({ state: 'CLOSED', podId: 'pod-1', timestamp: Date.now(), failureCount: 0 }),
    ]

    mockGetCacheStats.mockResolvedValue({ hits: 100, misses: 10, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready', auditEvents))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(body.auditEvents).toHaveLength(3)
    expect(body.auditEvents[0].state).toBe('OPEN')
    expect(body.auditEvents[0].podId).toBe('pod-1')
    expect(body.auditEvents[1].state).toBe('HALF_OPEN')
    expect(body.auditEvents[2].state).toBe('CLOSED')
  })

  // -----------------------------------------------------------------------
  // Audit events — gracefully handles non-JSON or invalid entries
  // -----------------------------------------------------------------------

  it('filters out non-JSON audit log entries gracefully', async () => {
    const mixedEntries = [
      JSON.stringify({ state: 'OPEN', podId: 'pod-1' }),
      'not-valid-json',
      JSON.stringify({ state: 'CLOSED', podId: 'pod-2' }),
      '',
      '{corrupted',
    ]

    mockGetCacheStats.mockResolvedValue({ hits: 50, misses: 5, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready', mixedEntries))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    // Only 2 valid JSON entries should survive
    expect(body.auditEvents).toHaveLength(2)
    expect(body.auditEvents[0].state).toBe('OPEN')
    expect(body.auditEvents[1].state).toBe('CLOSED')
  })

  // -----------------------------------------------------------------------
  // Audit events — returns empty array when lrange fails or Redis is down
  // -----------------------------------------------------------------------

  it('returns empty auditEvents when lrange throws', async () => {
    const faultyClient = createMockRedisClient('ready')
    faultyClient.lrange = jest.fn().mockRejectedValue(new Error('Redis busy'))

    mockGetCacheStats.mockResolvedValue({ hits: 10, misses: 2, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(faultyClient)
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(body.auditEvents).toEqual([])
  })

  it('returns empty auditEvents when Redis client is null in getRecentAuditEvents', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 10, misses: 2, redisErrors: 0 })
    // Call order: getRecentAuditEvents (1st) → main try block (2nd)
    mockGetRedisClient
      .mockResolvedValueOnce(null) // 1st: getRecentAuditEvents → null
      .mockResolvedValueOnce(createMockRedisClient('ready')) // 2nd: main → valid client
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(body.auditEvents).toEqual([])
    expect(body.redis.connected).toBe(true) // main getRedisClient succeeded
  })

  // -----------------------------------------------------------------------
  // Response shape — all fields present
  // -----------------------------------------------------------------------

  it('returns all expected top-level fields in the response', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 0, misses: 0, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready'))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    const expectedKeys = [
      'status',
      'hitRate',
      'hits',
      'misses',
      'redisErrors',
      'redis',
      'circuitBreaker',
      'retries',
      'auditEvents',
      'timestamp',
    ]

    for (const key of expectedKeys) {
      expect(body).toHaveProperty(key)
    }

    // Sub-object keys
    expect(body.redis).toHaveProperty('connected')
    expect(body.redis).toHaveProperty('status')
    expect(body.redis).toHaveProperty('connectionAttempts')
    expect(body.redis).toHaveProperty('nativeFallback')

    expect(body.circuitBreaker).toHaveProperty('state')
    expect(body.circuitBreaker).toHaveProperty('failureCount')
    expect(body.circuitBreaker).toHaveProperty('opens')
    expect(body.circuitBreaker).toHaveProperty('halfOpens')
    expect(body.circuitBreaker).toHaveProperty('closes')
    expect(body.circuitBreaker).toHaveProperty('rejects')
  })

  it('timestamp is a valid ISO date string', async () => {
    mockGetCacheStats.mockResolvedValue({ hits: 1, misses: 0, redisErrors: 0 })
    mockGetRedisClient.mockResolvedValue(createMockRedisClient('ready'))
    mockGetCircuitBreakerState.mockReturnValue('CLOSED')
    mockGetCacheHandlerMetrics.mockReturnValue(healthyMetrics())
    mockGetRedisConnectionInfo.mockReturnValue(healthyRedisConnInfo())

    const res = await GET()
    const body = await res.json()

    expect(() => new Date(body.timestamp)).not.toThrow()
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })
})
