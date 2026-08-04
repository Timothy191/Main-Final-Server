/**
 * @module redis/cache
 * Industry-verified L1 (in-memory) + L2 (Redis) two-layer cache API.
 *
 * Industry patterns applied:
 *  - TTL jitter (±10%) on all L2 writes — prevents synchronized mass expiry (cache stampede)
 *  - LRU eviction in L1 (see l1.ts)
 *  - In-process request coalescing via activeFetches Map
 *  - Optional distributed mutex via Redis SET NX PX (ENABLE_DISTRIBUTED_LOCK=true)
 *  - Optional gzip payload compression (CACHE_COMPRESSION=true)
 *  - Tag support in cacheWrap for on-demand invalidation
 *  - Hit-rate alerting: warns when miss rate exceeds HIT_RATE_ALERT_THRESHOLD
 *
 * References: redis.io/docs/manual/patterns/distributed-locks/
 */

import { recordCacheHit, recordCacheMiss, recordRedisError, getCacheStats } from './stats.js'
import {
  cacheInvalidateTags,
  cacheInvalidatePrefixes,
  indexCacheKeyByTags,
} from './invalidation.js'
import {
  l1Get as memoryGet,
  l1Set as memorySet,
  l1Delete as memoryDelete,
  l1DeleteByPrefix as memoryDeleteByPrefix,
  l1IndexTags,
  l1Clear,
} from './l1.js'
import { createGzip, createGunzip } from 'zlib'
import { pipeline as streamPipeline } from 'stream'
import { promisify } from 'util'
import { randomUUID } from 'crypto'

const pipelineAsync = promisify(streamPipeline)

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

/** When true, gzip-compress all L2 Redis payloads before writing. */
const COMPRESSION_ENABLED = process.env.CACHE_COMPRESSION === 'true'

/**
 * When true, use a Redis SET NX distributed mutex inside cacheWrap to prevent
 * thundering herd across multiple pod replicas. Requires real Redis (not native fallback).
 */
const DISTRIBUTED_LOCK_ENABLED = process.env.ENABLE_DISTRIBUTED_LOCK === 'true'

/** Alert when cache hit rate drops below this fraction (0–1). */
const HIT_RATE_ALERT_THRESHOLD = 0.5

/** Minimum total operations before hit-rate alerting activates. */
const HIT_RATE_ALERT_MIN_OPS = 100

let lastHitRateAlert = 0
const HIT_RATE_ALERT_COOLDOWN_MS = 60_000

// ---------------------------------------------------------------------------
// Compression helpers
// ---------------------------------------------------------------------------

async function gzipBuffer(data: string): Promise<Buffer> {
  const { Readable, Writable } = await import('stream')
  const chunks: Buffer[] = []
  const input = Readable.from([Buffer.from(data, 'utf8')])
  const gzip = createGzip()
  const collector = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk as Buffer)
      cb()
    },
  })
  await pipelineAsync(input, gzip, collector)
  return Buffer.concat(chunks)
}

async function gunzipBuffer(data: Buffer): Promise<string> {
  const { Readable, Writable } = await import('stream')
  const chunks: Buffer[] = []
  const input = Readable.from([data])
  const gunzip = createGunzip()
  const collector = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk as Buffer)
      cb()
    },
  })
  await pipelineAsync(input, gunzip, collector)
  return Buffer.concat(chunks).toString('utf8')
}

// ---------------------------------------------------------------------------
// Envelope stored in Redis (supports optional compression)
// ---------------------------------------------------------------------------

interface CacheEnvelope<T> {
  /** The serialized value (JSON string, or base64 of gzip when compressed) */
  v: string
  /** True when v is gzip-compressed and base64-encoded */
  gz?: true
  /** Original typed value — used when not compressed */
  _raw?: T
}

async function serialize<T>(value: T): Promise<string> {
  if (!COMPRESSION_ENABLED) {
    const envelope: CacheEnvelope<T> = { v: JSON.stringify(value) }
    return JSON.stringify(envelope)
  }
  const json = JSON.stringify(value)
  const compressed = await gzipBuffer(json)
  const envelope: CacheEnvelope<T> = { v: compressed.toString('base64'), gz: true }
  return JSON.stringify(envelope)
}

async function deserialize<T>(raw: string): Promise<T> {
  try {
    const envelope = JSON.parse(raw) as CacheEnvelope<T>
    if (envelope.gz) {
      const buf = Buffer.from(envelope.v, 'base64')
      const json = await gunzipBuffer(buf)
      return JSON.parse(json) as T
    }
    return JSON.parse(envelope.v) as T
  } catch {
    // Legacy format — stored as plain JSON (no envelope). Graceful fallback.
    return JSON.parse(raw) as T
  }
}

// ---------------------------------------------------------------------------
// TTL jitter — ±10% to prevent synchronized mass expiry
// ---------------------------------------------------------------------------

/**
 * Apply ±10% random jitter to a TTL value.
 * Industry-verified technique: prevents thundering herd when many keys
 * are set with the same TTL (e.g., after a full cache flush).
 */
function jitterTtl(ttlSeconds: number): number {
  const jitterFraction = Math.random() * 0.2 - 0.1 // ±10%
  return Math.max(1, Math.round(ttlSeconds * (1 + jitterFraction)))
}

// ---------------------------------------------------------------------------
// Redis client helper
// ---------------------------------------------------------------------------

async function getRedisClientSafe() {
  try {
    const { getRedisClient } = await import('./client.js')
    return await getRedisClient()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Hit-rate observability alerting
// ---------------------------------------------------------------------------

async function checkHitRateAlert(): Promise<void> {
  const now = Date.now()
  if (now - lastHitRateAlert < HIT_RATE_ALERT_COOLDOWN_MS) return
  try {
    const stats = await getCacheStats()
    const total = stats.hits + stats.misses
    if (total < HIT_RATE_ALERT_MIN_OPS) return
    const hitRate = stats.hits / total
    if (hitRate < HIT_RATE_ALERT_THRESHOLD) {
      lastHitRateAlert = now
      console.warn(
        `[Cache] ALERT: hit rate ${(hitRate * 100).toFixed(1)}% is below threshold ${(HIT_RATE_ALERT_THRESHOLD * 100).toFixed(0)}%` +
          ` (hits=${stats.hits}, misses=${stats.misses}, l1=${stats.l1Hits}, l2=${stats.l2Hits})`
      )
    }
  } catch {
    // Non-critical — never block on alerting
  }
}

// ---------------------------------------------------------------------------
// Core cache API
// ---------------------------------------------------------------------------

export async function cacheGet<T>(key: string): Promise<T | null> {
  const start = performance.now()

  const l1Value = memoryGet<T>(key)
  if (l1Value !== null) {
    recordCacheHit('l1', performance.now() - start)
    return l1Value
  }

  try {
    const redis = await getRedisClientSafe()
    if (!redis) {
      recordCacheMiss(performance.now() - start)
      return null
    }
    const value = await redis.get(key)
    if (value) {
      const parsed = await deserialize<T>(value)
      memorySet(key, parsed, 15)
      recordCacheHit('l2', performance.now() - start)
      return parsed
    }
    recordCacheMiss(performance.now() - start)
    // Fire-and-forget hit-rate check
    checkHitRateAlert().catch(() => {})
    return null
  } catch {
    recordRedisError()
    recordCacheMiss(performance.now() - start)
    return null
  }
}

export async function cacheGetWithStats<T>(
  key: string
): Promise<{ value: T | null; source: 'l1' | 'l2' | null }> {
  const start = performance.now()

  const l1Value = memoryGet<T>(key)
  if (l1Value !== null) {
    recordCacheHit('l1', performance.now() - start)
    return { value: l1Value, source: 'l1' }
  }

  try {
    const redis = await getRedisClientSafe()
    if (!redis) {
      recordCacheMiss(performance.now() - start)
      return { value: null, source: null }
    }
    const value = await redis.get(key)
    if (value) {
      const parsed = await deserialize<T>(value)
      memorySet(key, parsed, 15)
      recordCacheHit('l2', performance.now() - start)
      return { value: parsed, source: 'l2' }
    }
    recordCacheMiss(performance.now() - start)
    return { value: null, source: null }
  } catch {
    recordRedisError()
    recordCacheMiss(performance.now() - start)
    return { value: null, source: null }
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const l1Ttl = Math.min(ttlSeconds, 30)
  memorySet(key, value, l1Ttl)

  try {
    const redis = await getRedisClientSafe()
    if (redis) {
      // AGENT-TRACE: TTL jitter prevents synchronized mass expiry (cache stampede)
      const jitteredTtl = jitterTtl(ttlSeconds)
      const serialized = await serialize(value)
      if (typeof redis.setex === 'function') {
        await redis.setex(key, jitteredTtl, serialized)
      } else {
        await redis.set(key, serialized, 'EX', jitteredTtl)
      }
    }
  } catch {
    recordRedisError()
  }
}

export async function cacheSetWithTags<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  tags?: string[]
): Promise<void> {
  await cacheSet(key, value, ttlSeconds)
  if (tags && tags.length > 0) {
    l1IndexTags(key, tags)
    await indexCacheKeyByTags(key, tags)
  }
}

// ---------------------------------------------------------------------------
// Distributed lock helpers (Redis SET NX PX)
// AGENT-TRACE: Only active when ENABLE_DISTRIBUTED_LOCK=true.
// Prevents thundering herd on cache miss across multiple pod replicas.
// Pattern: redis.io/docs/manual/patterns/distributed-locks/
// ---------------------------------------------------------------------------

const LOCK_TTL_MS = 5000
const LOCK_POLL_INTERVAL_MS = 50
const LOCK_MAX_WAIT_MS = 4000

async function acquireLock(redis: any, lockKey: string, lockValue: string): Promise<boolean> {
  try {
    const result = await redis.set(lockKey, lockValue, 'NX', 'PX', LOCK_TTL_MS)
    return result === 'OK'
  } catch {
    return false
  }
}

async function releaseLock(redis: any, lockKey: string, lockValue: string): Promise<void> {
  try {
    // Lua script: only delete if we own the lock (prevents deleting another pod's lock)
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    if (typeof redis.eval === 'function') {
      await redis.eval(luaScript, 1, lockKey, lockValue)
    } else {
      // Fallback: simple DEL (less safe but better than leaving lock)
      await redis.del(lockKey)
    }
  } catch {
    // Fire-and-forget
  }
}

async function waitForLockRelease(redis: any, lockKey: string): Promise<void> {
  const deadline = Date.now() + LOCK_MAX_WAIT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, LOCK_POLL_INTERVAL_MS))
    try {
      const exists = await redis.exists(lockKey)
      if (!exists) return
    } catch {
      return // If we can't check, proceed optimistically
    }
  }
}

// ---------------------------------------------------------------------------
// In-process request coalescing (single-node) + optional distributed lock
// ---------------------------------------------------------------------------

const activeFetches = new Map<string, Promise<any>>()

export interface CacheWrapOptions {
  ttlSeconds?: number
  tags?: string[]
}

export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSecondsOrOptions?: number | CacheWrapOptions
): Promise<T> {
  const options: CacheWrapOptions =
    typeof ttlSecondsOrOptions === 'number'
      ? { ttlSeconds: ttlSecondsOrOptions }
      : (ttlSecondsOrOptions ?? {})
  const { ttlSeconds = 3600, tags } = options

  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  // --- Distributed lock path (multi-pod stampede prevention) ---
  if (DISTRIBUTED_LOCK_ENABLED) {
    const redis = await getRedisClientSafe()
    // Only attempt distributed lock with a real Redis client (not native fallback)
    if (redis && typeof redis.set === 'function' && typeof redis.eval !== 'undefined') {
      const lockKey = `arch:lock:${key}`
      const lockValue = randomUUID()
      const acquired = await acquireLock(redis, lockKey, lockValue)

      if (!acquired) {
        // We are a "waiter" — wait for the winner to populate the cache
        await waitForLockRelease(redis, lockKey)
        const afterWait = await cacheGet<T>(key)
        if (afterWait !== null) return afterWait
        // Winner failed — fall through to compute ourselves
      }

      try {
        // Re-check cache after acquiring (another pod may have filled it)
        const afterLock = await cacheGet<T>(key)
        if (afterLock !== null) return afterLock

        const result = await fn()
        if (tags && tags.length > 0) {
          await cacheSetWithTags(key, result, ttlSeconds, tags)
        } else {
          await cacheSet(key, result, ttlSeconds)
        }
        return result
      } finally {
        await releaseLock(redis, lockKey, lockValue)
      }
    }
  }

  // --- In-process request coalescing (single-node, always active) ---
  let activeFetch = activeFetches.get(key)
  if (!activeFetch) {
    activeFetch = fn()
      .then(async (result) => {
        if (tags && tags.length > 0) {
          await cacheSetWithTags(key, result, ttlSeconds, tags)
        } else {
          await cacheSet(key, result, ttlSeconds)
        }
        return result
      })
      .finally(() => {
        activeFetches.delete(key)
      })
    activeFetches.set(key, activeFetch)
  }

  return activeFetch as Promise<T>
}

// ---------------------------------------------------------------------------
// Deletion & invalidation
// ---------------------------------------------------------------------------

export async function cacheDelete(key: string): Promise<void> {
  memoryDelete(key)

  try {
    const redis = await getRedisClientSafe()
    if (redis) {
      await redis.del(key)
    }
  } catch {
    // Silent fail
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const prefix = pattern.replace('*', '')
  memoryDeleteByPrefix(prefix)
  await cacheInvalidatePrefixes([prefix])
}

export { cacheInvalidateTags, cacheInvalidatePrefixes }

export function cacheEvictL1ByPrefix(prefix: string): void {
  memoryDeleteByPrefix(prefix)
}

export function clearMemoryCache(): void {
  l1Clear()
}

// ---------------------------------------------------------------------------
// Class-based OOP API (convenience wrapper)
// ---------------------------------------------------------------------------

export interface CacheOptions {
  ttlSeconds?: number
  tags?: string[]
}

export class Cache {
  async get<T>(key: string): Promise<T | null> {
    return cacheGet<T>(key)
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttlSeconds ?? 3600
    if (options?.tags) {
      await cacheSetWithTags(key, value, ttl, options.tags)
    } else {
      await cacheSet(key, value, ttl)
    }
  }

  async delete(key: string): Promise<void> {
    await cacheDelete(key)
  }

  async invalidateTags(tags: string[]): Promise<number> {
    return cacheInvalidateTags(tags)
  }

  async invalidatePrefixes(prefixes: string[]): Promise<number> {
    return cacheInvalidatePrefixes(prefixes)
  }

  async wrap<T>(key: string, fn: () => Promise<T>, options?: CacheWrapOptions): Promise<T> {
    return cacheWrap<T>(key, fn, options)
  }
}

export const cache = new Cache()
