import RedisPkg from "ioredis";
import { getNativeRedisClient, NativeRedisClient } from "./native-client.ts";

const Redis = (RedisPkg as any).default || RedisPkg;

type RedisClient = import("ioredis").Redis | NativeRedisClient;

const REDIS_URL = process.env.REDIS_URL;
const USE_NATIVE = process.env.USE_NATIVE_CACHE === "true" || process.env.NODE_ENV === "test" || !REDIS_URL;

let client: any = null;
let connecting: Promise<any> | null = null;
let lastFailure = 0;

/**
 * Returns the Redis client if it is currently open, otherwise native client.
 */
export function getClientIfOpen(): any {
  if (USE_NATIVE) return getNativeRedisClient();
  return client?.status === "ready" ? client : getNativeRedisClient();
}

/**
 * Get or create the singleton Redis client.
 * Falls back to high-performance NativeRedisClient when external Redis is unavailable.
 */
export async function getRedisClient(): Promise<any> {
  if (USE_NATIVE) {
    return getNativeRedisClient();
  }

  if (client?.status === "ready") return client;
  if (connecting) return connecting;

  if (Date.now() - lastFailure < 5000) {
    return getNativeRedisClient();
  }

  connecting = (async () => {
    try {
      const next = new Redis(REDIS_URL!, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: false,
        connectTimeout: 1000,
        retryStrategy() {
          return null; // Don't block — fall back to Native immediately
        },
      });

      next.on("error", () => {
        if (client === next) client = null;
        connecting = null;
      });

      await next.connect();
      client = next;
      return client;
    } catch {
      lastFailure = Date.now();
      return getNativeRedisClient();
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

/**
 * Gracefully close connection.
 */
export async function closeRedis(): Promise<void> {
  if (client?.status === "ready" && typeof client.quit === "function") {
    await client.quit();
    client = null;
  }
  connecting = null;
}
