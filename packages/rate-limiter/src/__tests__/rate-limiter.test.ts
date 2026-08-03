/* eslint-env jest */
import {
  RateLimiter,
  MemoryStore,
  RedisStore,
  FixedWindowStrategy,
  TokenBucketStrategy,
  SlidingWindowStrategy,
} from '../index'

describe('MemoryStore', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  it('increments counter within window', async () => {
    const res1 = await store.increment('test-key', 60000)
    expect(res1.current).toBe(1)
    const res2 = await store.increment('test-key', 60000)
    expect(res2.current).toBe(2)
  })

  it('stores and retrieves key-value state', async () => {
    await store.set('key1', 'val1', 60000)
    const val = await store.get('key1')
    expect(val).toBe('val1')
  })

  it('clears all data', async () => {
    await store.set('key1', 'val1', 60000)
    await store.increment('key2', 60000)
    store.clear()
    expect(await store.get('key1')).toBeNull()
    const res = await store.increment('key2', 60000)
    expect(res.current).toBe(1)
  })
})

describe('RedisStore', () => {
  it('uses client.incr and client.expire when available', async () => {
    const mockCache = new Map<string, string>()
    const client = {
      status: 'ready',
      get: jest.fn(async (key: string) => mockCache.get(key) ?? null),
      set: jest.fn(async (key: string, val: string) => {
        mockCache.set(key, val)
      }),
      incr: jest.fn(async (key: string) => {
        const current = parseInt(mockCache.get(key) || '0', 10) + 1
        mockCache.set(key, String(current))
        return current
      }),
      expire: jest.fn(async () => true),
    }

    const store = new RedisStore(client)
    const res = await store.increment('test', 60000)
    expect(res.current).toBe(1)
    expect(client.incr).toHaveBeenCalled()
    expect(client.expire).toHaveBeenCalledWith(expect.any(String), 60)
  })
})

describe('TokenBucketStrategy', () => {
  let store: MemoryStore
  let strategy: TokenBucketStrategy

  beforeEach(() => {
    store = new MemoryStore()
    strategy = new TokenBucketStrategy()
  })

  it('allows requests up to capacity and denies when empty', async () => {
    const capacity = 3
    const windowMs = 60000
    const key = 'user-tb'

    // First 3 requests consume 3 tokens
    const r1 = await strategy.check(key, capacity, windowMs, store)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = await strategy.check(key, capacity, windowMs, store)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = await strategy.check(key, capacity, windowMs, store)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)

    // 4th request exceeds capacity
    const r4 = await strategy.check(key, capacity, windowMs, store)
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
    expect(r4.retryAfter).toBeGreaterThan(0)
  })
})

describe('SlidingWindowStrategy', () => {
  let store: MemoryStore
  let strategy: SlidingWindowStrategy

  beforeEach(() => {
    store = new MemoryStore()
    strategy = new SlidingWindowStrategy()
  })

  it('allows requests up to limit and correctly tracks remaining tokens', async () => {
    const limit = 2
    const windowMs = 60000
    const key = 'user-sw'

    const r1 = await strategy.check(key, limit, windowMs, store)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(1)

    const r2 = await strategy.check(key, limit, windowMs, store)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(0)

    const r3 = await strategy.check(key, limit, windowMs, store)
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(r3.retryAfter).toBeGreaterThan(0)
  })
})

describe('RateLimiter Class', () => {
  it('works with SlidingWindowStrategy', async () => {
    const store = new MemoryStore()
    const strategy = new SlidingWindowStrategy()
    const limiter = new RateLimiter({ store, strategy, limit: 5, windowMs: 60000 })

    const result = await limiter.check('id-123')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(4)
  })

  it('works with TokenBucketStrategy', async () => {
    const store = new MemoryStore()
    const strategy = new TokenBucketStrategy()
    const limiter = new RateLimiter({ store, strategy, limit: 10, windowMs: 60000 })

    const result = await limiter.check('id-456')
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(10)
    expect(result.remaining).toBe(9)
  })
})
