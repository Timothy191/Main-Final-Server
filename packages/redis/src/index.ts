/**
 * @repo/redis — shared Redis client singleton
 *
 * Usage:
 *   import { redis } from "@repo/redis";
 *   await redis.set("key", "value", "EX", 60);
 */
import Redis from "ioredis";

let _client: Redis | null = null;

function createClient(): Redis {
  const url = process.env["REDIS_URL"];
  if (!url) {
    throw new Error(
      "[redis] REDIS_URL environment variable is not set. " +
        "Add REDIS_URL=redis://localhost:6379 to your .env file."
    );
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on("error", (err: Error) => {
    console.error("[redis] Connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[redis] Connected:", url.replace(/\/\/.*@/, "//<credentials>@"));
  });

  return client;
}

/**
 * Returns the shared Redis singleton.
 * Initialises lazily on first access.
 *
 * @throws {Error} if `REDIS_URL` is not set.
 */
export function getRedis(): Redis {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

/** The Redis singleton — preferred import for most use-cases. */
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type { Redis };

/** Legacy alias for {@link getRedis}. */
export function getRedisClient(): Redis {
  return getRedis();
}

/**
 * Well-known cache category constants.
 * Used with {@link buildCacheKey} to construct namespaced Redis keys.
 */
export const CacheCategory = {
  ACCESS_CONTROL: "access_control",
  AUTH: "auth",
  DRILLING: "drilling",
  HUB: "hub",
  METRICS: "metrics",
  TRAINING: "training",
};

export { getCacheStats } from "./stats";

// Re-export the modern L1/L2 caching implementation from cache.ts
// This overwrites the legacy cacheGet/cacheSet/cacheWrap with the version
// that includes in-memory cache, request coalescing, and stats tracking.
export {
  cacheGet,
  cacheGetWithStats,
  cacheSet,
  cacheSetWithTags,
  cacheWrap,
  cacheDelete,
  cacheDeletePattern,
  cacheInvalidateTags,
  cacheInvalidatePrefixes,
  cacheEvictL1ByPrefix,
  clearMemoryCache,
  Cache,
  type CacheOptions,
  cache,
} from "./cache";
