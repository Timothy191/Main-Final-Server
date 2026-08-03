import { recordCacheHit, recordCacheMiss, recordRedisError, getCacheStats } from "./stats.js";
import {
  cacheInvalidateTags,
  cacheInvalidatePrefixes,
  indexCacheKeyByTags,
} from "./invalidation.js";
import {
  l1Get as memoryGet,
  l1Set as memorySet,
  l1Delete as memoryDelete,
  l1DeleteByPrefix as memoryDeleteByPrefix,
  l1IndexTags,
  l1Clear,
} from "./l1.js";

async function getRedisClientSafe() {
  try {
    const { getRedisClient } = await import("./client.js");
    return await getRedisClient();
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const start = performance.now();

  const l1Value = memoryGet<T>(key);
  if (l1Value !== null) {
    recordCacheHit("l1", performance.now() - start);
    return l1Value;
  }

  try {
    const redis = await getRedisClientSafe();
    if (!redis) {
      recordCacheMiss(performance.now() - start);
      return null;
    }
    const value = await redis.get(key);
    if (value) {
      const parsed = JSON.parse(value) as T;
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

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const l1Ttl = Math.min(ttlSeconds, 30);
  memorySet(key, value, l1Ttl);

  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      if (typeof redis.setex === "function") {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      }
    }
  } catch {
    recordRedisError();
  }
}

export async function cacheSetWithTags<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  tags?: string[]
): Promise<void> {
  await cacheSet(key, value, ttlSeconds);
  if (tags && tags.length > 0) {
    l1IndexTags(key, tags);
    await indexCacheKeyByTags(key, tags);
  }
}

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

export async function cacheDelete(key: string): Promise<void> {
  memoryDelete(key);

  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.del(key);
    }
  } catch {
    // Silent fail
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  const prefix = pattern.replace("*", "");
  memoryDeleteByPrefix(prefix);
  await cacheInvalidatePrefixes([prefix]);
}

export { cacheInvalidateTags, cacheInvalidatePrefixes };

export function cacheEvictL1ByPrefix(prefix: string): void {
  memoryDeleteByPrefix(prefix);
}

export function clearMemoryCache(): void {
  l1Clear();
}

export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
}

export class Cache {
  async get<T>(key: string): Promise<T | null> {
    return cacheGet<T>(key);
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttlSeconds ?? 3600;
    if (options?.tags) {
      await cacheSetWithTags(key, value, ttl, options.tags);
    } else {
      await cacheSet(key, value, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    await cacheDelete(key);
  }

  async invalidateTags(tags: string[]): Promise<number> {
    return cacheInvalidateTags(tags);
  }

  async invalidatePrefixes(prefixes: string[]): Promise<number> {
    return cacheInvalidatePrefixes(prefixes);
  }
}

export const cache = new Cache();
