/**
 * @repo/redis — High-Performance Caching & Event Bus Package (Native In-Process + Redis Bridge)
 *
 * Provides sub-microsecond in-memory caching and Redis-compatible contracts
 * with 0 external dependency requirements.
 */
import { getRedisClient, closeRedis } from "./client.js";
import { getNativeRedisClient, NativeRedisClient } from "./native-client.js";
import { getNativeEventBus, nativeEventBus, SystemEventPayload } from "./event-bus.js";

export function getRedis(): any {
  return getNativeRedisClient();
}

/** The Redis singleton proxy — delegates directly to native/active client. */
export const redis = new Proxy({} as any, {
  get(_target, prop) {
    const client = getNativeRedisClient();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});

export {
  getRedisClient,
  closeRedis,
  getNativeRedisClient,
  NativeRedisClient,
  getNativeEventBus,
  nativeEventBus,
  type SystemEventPayload,
};

export const CacheCategory = {
  ACCESS_CONTROL: "access_control",
  AUTH: "auth",
  DRILLING: "drilling",
  HUB: "hub",
  METRICS: "metrics",
  TRAINING: "training",
};

export { getCacheStats } from "./stats.js";

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
} from "./cache.js";
