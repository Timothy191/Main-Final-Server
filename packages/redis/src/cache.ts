import { recordCacheHit, recordCacheMiss, recordRedisError, getCacheStats } from "@repo/redis/stats";
import {
  cacheInvalidateTags,
  cacheInvalidatePrefixes,
  indexCacheKeyByTags,
} from "@repo/redis/invalidation";

// ------------------------------------------------------------------
// L1 In-Memory Cache with TTL + LRU eviction
// ------------------------------------------------------------------

const L1_MAX_ENTRIES = 1000;

interface MemoryEntry {
  value: string;
  expires: number;
}

const memoryCache = new Map<string, MemoryEntry>();

function memoryGet<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(item.value) as T;
}

function memorySet<T>(key: string, value: T, ttlSeconds: number): void {
  // Evict oldest entry if at capacity (simple LRU: delete first insertion)
  if (memoryCache.size >= L1_MAX_ENTRIES && !memoryCache.has(key)) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey !== undefined) {
      memoryCache.delete(firstKey);
    }
  }

  memoryCache.set(key, {
    value: JSON.stringify(value),
    expires: Date.now() + ttlSeconds * 1000,
  });
}

function memoryDelete(key: string): void {
  memoryCache.delete(key);
}

function memoryDeleteByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

// ------------------------------------------------------------------
// Redis client safe wrapper
// ------------------------------------------------------------------

async function getRedisClientSafe() {
  try {
    const { getRedisClient } = await import("@repo/redis/client");
    return await getRedisClient();
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Core cache operations with stats
// ------------------------------------------------------------------

/**
 * Get a cached value by key.
 * Checks L1 (In-Memory) first for ultra-low latency, then falls back to L2 (Redis).
 * Returns null if not found or on error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const start = performance.now();

  // 1. Check L1 Cache (Local Memory) first - speed: < 0.1ms
  const l1Value = memoryGet<T>(key);
  if (l1Value !== null) {
    recordCacheHit("l1", performance.now() - start);
    return l1Value;
  }

  // 2. Miss in L1, check L2 Cache (Redis)
  try {
    const redis = await getRedisClientSafe();
    if (!redis) {
      recordCacheMiss(performance.now() - start);
      return null;
    }
    const value = await redis.get(key);
    if (value) {
      const parsed = JSON.parse(value) as T;

      // Populate L1 cache with a short TTL (15s) to accelerate subsequent near-term reads
      memorySet(key, parsed, 15);
      recordCacheHit("l2", performance.now() - start);
      return parsed;
    }
    recordCacheMiss(performance.now() - start);
    return null;
  } catch {
    recordRedisError();
    recordCacheMiss(performance.now() - start);
    return null;
  }
}

/**
 * Get a cached value and report which layer served it.
 * Returns { value, source } where source is "l1", "l2", or null.
 */
export async function cacheGetWithStats<T>(
  key: string
): Promise<{ value: T | null; source: "l1" | "l2" | null }> {
  const start = performance.now();

  const l1Value = memoryGet<T>(key);
  if (l1Value !== null) {
    recordCacheHit("l1", performance.now() - start);
    return { value: l1Value, source: "l1" };
  }

  try {
    const redis = await getRedisClientSafe();
    if (!redis) {
      recordCacheMiss(performance.now() - start);
      return { value: null, source: null };
    }
    const value = await redis.get(key);
    if (value) {
      const parsed = JSON.parse(value) as T;
      memorySet(key, parsed, 15);
      recordCacheHit("l2", performance.now() - start);
      return { value: parsed, source: "l2" };
    }
    recordCacheMiss(performance.now() - start);
    return { value: null, source: null };
  } catch {
    recordRedisError();
    recordCacheMiss(performance.now() - start);
    return { value: null, source: null };
  }
}

/**
 * Store a value in cache with a TTL (seconds).
 * Writes to both L1 (Memory) and L2 (Redis) - Write-Through.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  // 1. Write to L1 Cache (Local Memory) - cap L1 TTL at 30s to keep memory footprint lean
  const l1Ttl = Math.min(ttlSeconds, 30);
  memorySet(key, value, l1Ttl);

  // 2. Write to L2 Cache (Redis)
  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
  } catch {
    recordRedisError();
  }
}

/**
 * Store a value in cache with a TTL and associate it with tags for later invalidation.
 */
export async function cacheSetWithTags<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  tags?: string[]
): Promise<void> {
  await cacheSet(key, value, ttlSeconds);
  if (tags && tags.length > 0) {
    await indexCacheKeyByTags(key, tags);
  }
}

/**
 * Wrap a function with Redis caching.
 * If the key exists in cache, returns it; otherwise calls fn, stores result, and returns it.
 */
// Request Coalescing (Single-Flight) map for active computations
const activeFetches = new Map<string, Promise<any>>();

export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  let activeFetch = activeFetches.get(key);
  if (!activeFetch) {
    activeFetch = fn()
      .then(async (result) => {
        await cacheSet(key, result, ttlSeconds ?? 3600);
        return result;
      })
      .finally(() => {
        activeFetches.delete(key);
      });
    activeFetches.set(key, activeFetch);
  }

  return activeFetch as Promise<T>;
}

/**
 * Delete a specific key from cache.
 * Also removes from memory cache if Redis unavailable.
 */
export async function cacheDelete(key: string): Promise<void> {
  memoryDelete(key);

  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.del(key);
    }
  } catch {
    // Silent fail - memory cache already deleted
  }
}

/**
 * Delete all keys matching a pattern.
 * @deprecated Use cacheInvalidatePrefixes for safe SCAN-based deletion.
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  // Delete matching keys from memory cache
  const prefix = pattern.replace("*", "");
  memoryDeleteByPrefix(prefix);

  // Delegate to safe SCAN-based invalidation
  await cacheInvalidatePrefixes([prefix]);
}

export { cacheInvalidateTags, cacheInvalidatePrefixes };

/**
 * Evict keys from the L1 in-memory cache by prefix.
 * Useful in middleware where Redis may not be available.
 */
export function cacheEvictL1ByPrefix(prefix: string): void {
  memoryDeleteByPrefix(prefix);
}

/**
 * Clear the entire L1 in-memory cache.
 * Useful in test environments to prevent state leakage between tests.
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

// ------------------------------------------------------------------
// Unified Cache Class & Global Singleton (@repo/redis v2 API)
// ------------------------------------------------------------------

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  prefix?: string;
}

export class Cache {
  private defaultUrl: string;

  constructor(defaultUrl?: string) {
    this.defaultUrl = defaultUrl ?? process.env["REDIS_URL"] ?? "";
  }

  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  async get<T>(key: string, prefix?: string): Promise<T | null> {
    const fullKey = this.buildKey(key, prefix);
    return cacheGet<T>(fullKey);
  }

  async set<T>(key: string, value: T, opts?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, opts?.prefix);
    const ttl = opts?.ttl ?? 3600;
    if (opts?.tags && opts.tags.length > 0) {
      await cacheSetWithTags(fullKey, value, ttl, opts.tags);
    } else {
      await cacheSet(fullKey, value, ttl);
    }
  }

  async wrap<T>(key: string, fn: () => Promise<T>, opts?: CacheOptions): Promise<T> {
    const fullKey = this.buildKey(key, opts?.prefix);
    const cached = await this.get<T>(key, opts?.prefix);
    if (cached !== null) return cached;

    let activeFetch = activeFetches.get(fullKey);
    if (!activeFetch) {
      activeFetch = fn()
        .then(async (result) => {
          await this.set(key, result, opts);
          return result;
        })
        .finally(() => {
          activeFetches.delete(fullKey);
        });
      activeFetches.set(fullKey, activeFetch);
    }

    return activeFetch as Promise<T>;
  }

  async invalidateTags(tags: string[]): Promise<number> {
    return cacheInvalidateTags(tags);
  }

  async invalidatePrefix(prefix: string): Promise<number> {
    return cacheInvalidatePrefixes([prefix]);
  }

  async clear(): Promise<void> {
    clearMemoryCache();
    try {
      const redis = await getRedisClientSafe();
      if (redis) {
        await redis.flushdb();
      }
    } catch {
      // Graceful fallback if Redis unavailable
    }
  }

  get isConnected(): boolean {
    return Boolean(process.env["REDIS_URL"]);
  }

  get stats() {
    return getCacheStats();
  }
}

export const cache = new Cache();

