/**
 * Tests for next-cache-handler.ts — Redis-backed Next.js 16 CacheHandler.
 *
 * Mocks @repo/redis/client so tests run without an actual Redis connection.
 *
 * Covers:
 *   - set()/get() round-trip through the base64 ReadableStream encoding
 *   - Per-entry Redis TTL derived from entry.expire (cacheLife profiles) + clamping
 *   - Tag revalidation: updateTags / getExpiration / refreshTags / soft-tag rejection
 *   - Graceful degradation (Redis unavailable)
 *   - Circuit breaker and metrics counters
 */

import { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'node:util'

if (!globalThis.ReadableStream) {
  ;(globalThis as any).ReadableStream = NodeReadableStream
}
if (!globalThis.TextEncoder) {
  ;(globalThis as any).TextEncoder = NodeTextEncoder
}
if (!globalThis.TextDecoder) {
  ;(globalThis as any).TextDecoder = NodeTextDecoder
}

// ---------------------------------------------------------------------------
// Fake Redis client
// ---------------------------------------------------------------------------

interface FakeRedis {
  store: Map<string, string>
  sets: Map<string, Set<string>>
  setCalls: Array<{ key: string; value: string; mode?: string; ttl?: number }>
  get: jest.Mock
  set: jest.Mock
  sadd: jest.Mock
  smembers: jest.Mock
  mget: jest.Mock
}

function createFakeRedis(): FakeRedis {
  const store = new Map<string, string>()
  const sets = new Map<string, Set<string>>()
  const setCalls: FakeRedis['setCalls'] = []

  return {
    store,
    sets,
    setCalls,
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string, mode?: string, ttl?: number) => {
      store.set(key, value)
      setCalls.push({ key, value, mode, ttl })
      return 'OK'
    }),
    sadd: jest.fn(async (key: string, ...members: string[]) => {
      if (!sets.has(key)) sets.set(key, new Set())
      const s = sets.get(key)!
      let added = 0
      for (const m of members) {
        if (!s.has(m)) {
          s.add(m)
          added++
        }
      }
      return added
    }),
    smembers: jest.fn(async (key: string) => Array.from(sets.get(key) ?? [])),
    mget: jest.fn(async (keys: string[]) => keys.map((k) => store.get(k) ?? null)),
  }
}

let fakeRedis = createFakeRedis()
const getRedisClientMock: jest.Mock = jest.fn(() => fakeRedis)

jest.mock('@repo/redis/client', () => ({
  getRedisClient: jest.fn(async () => getRedisClientMock()),
  createPubSubClient: jest.fn(async () => null),
}))

import * as handler from '../next-cache-handler'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(
  payload: string,
  opts: Partial<{
    tags: string[]
    stale: number
    timestamp: number
    expire: number
    revalidate: number
  }> = {}
) {
  return {
    value: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(payload))
        controller.close()
      },
    }),
    tags: opts.tags ?? [],
    stale: opts.stale ?? 30,
    timestamp: opts.timestamp ?? Date.now(),
    expire: opts.expire ?? 300,
    revalidate: opts.revalidate ?? 60,
  }
}

async function drainStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

beforeEach(() => {
  fakeRedis = createFakeRedis()
  getRedisClientMock.mockImplementation(() => fakeRedis)
  handler.resetCacheHandlerMetrics?.()
  handler.resetCircuitBreaker?.()
})

// ---------------------------------------------------------------------------
// set() / get() round-trip
// ---------------------------------------------------------------------------

it('round-trips an entry through set() and get()', async () => {
  const entry = makeEntry('hello-cache', { tags: ['round-trip'], expire: 300 })
  await handler.set('rt-key', Promise.resolve(entry))

  const result = await handler.get('rt-key', [])
  expect(result).toBeDefined()
  expect(result!.tags).toEqual(['round-trip'])
  expect(result!.expire).toBe(300)
  expect(result!.revalidate).toBe(60)
  await expect(drainStream(result!.value)).resolves.toBe('hello-cache')
})

it('returns undefined for a missing key', async () => {
  const result = await handler.get('missing-key', [])
  expect(result).toBeUndefined()
})

// ---------------------------------------------------------------------------
// Per-entry TTL derivation (P2)
// ---------------------------------------------------------------------------

it('uses entry.expire as the Redis TTL (1 minute profile)', async () => {
  await handler.set('ttl-60', Promise.resolve(makeEntry('a', { expire: 60 })))
  const call = fakeRedis.setCalls.find((c) => c.key === 'next:cache:ttl-60')
  expect(call).toBeDefined()
  expect(call!.mode).toBe('EX')
  expect(call!.ttl).toBe(60)
})

it('uses entry.expire as the Redis TTL (24 hours profile)', async () => {
  await handler.set('ttl-day', Promise.resolve(makeEntry('b', { expire: 86400 })))
  const call = fakeRedis.setCalls.find((c) => c.key === 'next:cache:ttl-day')
  expect(call!.ttl).toBe(86400)
})

it('clamps INFINITE_CACHE-style expire values to the max TTL', async () => {
  await handler.set('ttl-inf', Promise.resolve(makeEntry('c', { expire: 0xfffffffe })))
  const call = fakeRedis.setCalls.find((c) => c.key === 'next:cache:ttl-inf')
  expect(call!.ttl).toBe(7 * 86400)
})

it('rejects entries older than their expire window on get()', async () => {
  const stale = makeEntry('old', { timestamp: Date.now() - 120_000, expire: 60 })
  await handler.set('expired-key', Promise.resolve(stale))
  const result = await handler.get('expired-key', [])
  expect(result).toBeUndefined()
})

// ---------------------------------------------------------------------------
// Tag revalidation: updateTags / getExpiration / refreshTags / soft tags
// ---------------------------------------------------------------------------

it('getExpiration returns 0 for never-revalidated tags', async () => {
  await expect(handler.getExpiration(['never-touched-tag'])).resolves.toBe(0)
})

it('getExpiration returns the revalidation timestamp after updateTags', async () => {
  const before = Date.now()
  await handler.updateTags(['exp-tag'])
  const ts = await handler.getExpiration(['exp-tag'])
  expect(ts).toBeGreaterThanOrEqual(before)
})

it('updateTags persists tag timestamps to Redis for cross-pod sync', async () => {
  await handler.updateTags(['pod-tag'])
  expect(fakeRedis.store.get('next:tag:pod-tag')).toBeDefined()
  expect(fakeRedis.sets.get('next:revalidated-tags')?.has('pod-tag')).toBe(true)
})

it('get() rejects entries whose hard tag was revalidated after creation', async () => {
  const entry = makeEntry('tagged', { tags: ['hard-tag'], timestamp: Date.now() - 5000 })
  await handler.set('hard-tag-key', Promise.resolve(entry))
  await handler.updateTags(['hard-tag'])
  const result = await handler.get('hard-tag-key', [])
  expect(result).toBeUndefined()
})

it('get() rejects entries via soft tags', async () => {
  const entry = makeEntry('soft', { tags: [], timestamp: Date.now() - 5000 })
  await handler.set('soft-tag-key', Promise.resolve(entry))
  await handler.updateTags(['soft-route-tag'])
  const result = await handler.get('soft-tag-key', ['soft-route-tag'])
  expect(result).toBeUndefined()
})

it('refreshTags syncs tag timestamps written by another pod', async () => {
  // Simulate another pod writing a tag revalidation directly to Redis
  const remoteTs = Date.now()
  fakeRedis.store.set('next:tag:remote-tag', String(remoteTs))
  fakeRedis.sets.set('next:revalidated-tags', new Set(['remote-tag']))

  await handler.refreshTags()
  await expect(handler.getExpiration(['remote-tag'])).resolves.toBe(remoteTs)
})

// ---------------------------------------------------------------------------
// Graceful degradation
// ---------------------------------------------------------------------------

it('get() returns undefined when the Redis client is unavailable', async () => {
  getRedisClientMock.mockImplementation(() => {
    throw new Error('Redis down')
  })
  const result = await handler.get('degraded-key', [])
  expect(result).toBeUndefined()
})

it('set() resolves without throwing when the Redis client is unavailable', async () => {
  getRedisClientMock.mockImplementation(() => {
    throw new Error('Redis down')
  })
  await expect(
    handler.set('degraded-set', Promise.resolve(makeEntry('x')))
  ).resolves.toBeUndefined()
})

it('updateTags still records local timestamps when Redis is unavailable', async () => {
  getRedisClientMock.mockImplementation(() => {
    throw new Error('Redis down')
  })
  await handler.updateTags(['local-only-tag'])
  const ts = await handler.getExpiration(['local-only-tag'])
  expect(ts).toBeGreaterThan(0)
})

// ---------------------------------------------------------------------------
// Metrics & circuit breaker
// ---------------------------------------------------------------------------

it('tracks hits and misses in metrics', async () => {
  await handler.set('metric-key', Promise.resolve(makeEntry('m')))
  handler.resetCacheHandlerMetrics()

  await handler.get('metric-key', [])
  await handler.get('metric-miss', [])

  const metrics = handler.getCacheHandlerMetrics()
  expect(metrics.getCalls).toBe(2)
  expect(metrics.getHits).toBe(1)
  expect(metrics.getMisses).toBe(1)
})

it('getCacheHandlerMetrics returns an immutable snapshot', async () => {
  const before = handler.getCacheHandlerMetrics()
  expect(before.getCalls).toBe(0)

  await handler.get('snap-key', [])
  expect(handler.getCacheHandlerMetrics().getCalls).toBe(1)
  expect(before.getCalls).toBe(0)
})

it('circuit breaker stays CLOSED on successful operations', async () => {
  await handler.get('cb-a', [])
  await handler.get('cb-b', [])
  expect(handler.getCircuitBreakerState()).toBe('CLOSED')
})

it('circuit breaker trips to OPEN after repeated Redis failures', async () => {
  fakeRedis.get.mockRejectedValue(new Error('Persistent failure'))
  for (let i = 0; i < 5; i++) {
    await handler.get(`cb-fail-${i}`, [])
  }
  expect(handler.getCircuitBreakerState()).toBe('OPEN')

  // Requests are fast-rejected while OPEN
  handler.resetCacheHandlerMetrics()
  fakeRedis.get.mockClear()
  await handler.get('cb-rejected', [])
  expect(fakeRedis.get).not.toHaveBeenCalled()
  expect(handler.getCacheHandlerMetrics().getErrors).toBe(1)
}, 30_000)
