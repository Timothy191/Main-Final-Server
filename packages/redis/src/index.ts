/**
 * @repo/redis — High-Performance Caching & Event Bus Package (Native In-Process + Redis Bridge)
 *
 * Provides sub-microsecond in-memory caching and Redis-compatible contracts
 * with 0 external dependency requirements.
 *
 * AGENT-TRACE: CacheCategory consolidated into registry.ts (single source of truth).
 * Previously duplicated/diverged between registry.ts and this file.
 */
import { getRedisClient, closeRedis } from './client.js'
import { getNativeRedisClient, NativeRedisClient } from './native-client.js'
import { getNativeEventBus, nativeEventBus, SystemEventPayload } from './event-bus.js'

export interface RedisLikeClient extends NativeRedisClient {
  [key: string]: any
}

export function getRedis(): RedisLikeClient {
  return getNativeRedisClient() as RedisLikeClient
}

/** The Redis singleton proxy — delegates directly to native/active client. */
export const redis: RedisLikeClient = new Proxy({} as RedisLikeClient, {
  get(_target, prop: string | symbol) {
    const client = getNativeRedisClient()
    const val = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})

export {
  getRedisClient,
  closeRedis,
  getNativeRedisClient,
  NativeRedisClient,
  getNativeEventBus,
  nativeEventBus,
  type SystemEventPayload,
}

// Re-export from the single source of truth (registry.ts)
export { CacheCategory, CACHE_TTL_REGISTRY, buildCacheKey } from './registry.js'
export type { CacheCategory as CacheCategoryType, CacheTtlConfig } from './registry.js'

export { getCacheStats } from './stats.js'

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
  type CacheWrapOptions,
  cache,
} from './cache.js'
