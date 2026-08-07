import { getNativeRedisClient, NativeRedisClient } from './native-client.js'
import { SQLiteCacheEngine } from './sqlite-client.js'

let RedisConstructor: any = null
async function getRedisConstructor() {
  if (!RedisConstructor) {
    const pkg = (await import('ioredis')) as any
    RedisConstructor = pkg.default?.default || pkg.default || pkg
  }
  return RedisConstructor
}

type RedisClient = any | NativeRedisClient | SQLiteCacheEngine

// ---------------------------------------------------------------------------
// Connection configuration
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL

/** Redis Sentinel service name for high-availability failover. */
const REDIS_SENTINEL_SERVICE = process.env.REDIS_SENTINEL_SERVICE

/**
 * Comma-separated list of sentinel nodes (host:port).
 * Example: "sentinel1:26379,sentinel2:26379,sentinel3:26379"
 */
const REDIS_SENTINEL_NODES = process.env.REDIS_SENTINEL_NODES

/** Redis Sentinel password (if sentinels require auth). */
const REDIS_SENTINEL_PASSWORD = process.env.REDIS_SENTINEL_PASSWORD

/** Redis master password to authenticate with the Redis master. */
const REDIS_PASSWORD = process.env.REDIS_PASSWORD

const USE_SENTINEL = !!(REDIS_SENTINEL_SERVICE && REDIS_SENTINEL_NODES)
const USE_NATIVE = process.env.USE_NATIVE_CACHE === 'true' || process.env.NODE_ENV === 'test'

// Shared persistent fallback local cache instance
let _sqliteCacheFallback: SQLiteCacheEngine | null = null
function getFallbackClient(): any {
  if (process.env.NODE_ENV === 'test') {
    return getNativeRedisClient()
  }
  if (!_sqliteCacheFallback) {
    _sqliteCacheFallback = new SQLiteCacheEngine('arch-cache.db')
  }
  return _sqliteCacheFallback
}

let client: any = null
let connecting: Promise<any> | null = null
let connectionAttempts = 0
let lastFailure = 0

/** Time between health check pings (30s). */
const HEALTH_CHECK_INTERVAL_MS = 30_000

/** Max ioredis retries per individual command before giving up. */
const MAX_RETRIES_PER_REQUEST = 3

/**
 * Build ioredis connection options — handles both direct Redis and Sentinel modes.
 *
 * Sentinel mode is activated when REDIS_SENTINEL_SERVICE and REDIS_SENTINEL_NODES
 * are set. Falls back to direct REDIS_URL connection otherwise.
 */
function buildConnectionOptions() {
  if (USE_SENTINEL) {
    const sentinels = REDIS_SENTINEL_NODES!.split(',').map((node) => {
      const [host, port] = node.trim().split(':')
      return { host, port: port ? parseInt(port, 10) : 26379 }
    })

    return {
      sentinels,
      name: REDIS_SENTINEL_SERVICE!,
      sentinelPassword: REDIS_SENTINEL_PASSWORD || undefined,
      password: REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
      enableReadyCheck: true,
      // Must be lazy: getRedisClient() awaits an explicit connect(), and
      // ioredis throws "already connecting/connected" if auto-connect raced it.
      lazyConnect: true,
      connectTimeout: 2000,
      keepAlive: 5000,
      retryStrategy,
      enableOfflineQueue: false,
    }
  }

  // Direct connection (default)
  return {
    maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 2000,
    keepAlive: 5000,
    retryStrategy,
    enableOfflineQueue: false,
  }
}

/**
 * ioredis retry strategy — exponential backoff then graceful fallback.
 *
 * Attempts reconnection with delays: 200ms, 400ms, 800ms (capped at 2s).
 * After maxReconnectAttempts (6), returns null to stop retrying and
 * signals fallback to NativeRedisClient.
 *
 * Exported for testing. Internal consumers should use getRedisClient().
 */
export function retryStrategy(times: number): number | null {
  const maxReconnectAttempts = 6
  if (times > maxReconnectAttempts) {
    console.warn(
      `[RedisClient] connection lost — ${times} retries exhausted, falling back to NativeRedisClient`
    )
    return null // Stop retrying — fallback to native
  }

  // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 2000ms, 2000ms
  const delay = Math.min(200 * 2 ** (times - 1), 2000)
  // Add ±100ms jitter to spread reconnection across pods
  const jitter = Math.round(Math.random() * 200 - 100)
  console.warn(
    `[RedisClient] reconnect attempt ${times}/${maxReconnectAttempts} in ${delay + jitter}ms`
  )
  return delay + jitter
}

/** Periodic health check — pings Redis to keep connection alive. */
let healthCheckTimer: ReturnType<typeof setInterval> | null = null

/**
 * Start periodic health check pings on the given Redis client.
 * Exported for testing. Internal consumers use getRedisClient() which
 * calls this automatically on connection.
 */
export function startHealthCheck(redisClient: any): void {
  stopHealthCheck()
  healthCheckTimer = setInterval(async () => {
    try {
      if (redisClient?.status === 'ready' && typeof redisClient.ping === 'function') {
        await redisClient.ping()
      }
    } catch {
      // Health check failed — ioredis's built-in reconnect will handle it
    }
  }, HEALTH_CHECK_INTERVAL_MS)
  // Allow the process to exit even if the timer is still active
  if (healthCheckTimer && typeof healthCheckTimer === 'object' && 'unref' in healthCheckTimer) {
    ;(healthCheckTimer as any).unref()
  }
}

/**
 * Stop the health check timer if active.
 * Exported for testing and cleanup.
 */
export function stopHealthCheck(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer)
    healthCheckTimer = null
  }
}

/**
 * Returns the Redis client if it is currently open, otherwise native client.
 */
export function getClientIfOpen(): any {
  if (USE_NATIVE) return getFallbackClient()
  return client?.status === 'ready' ? client : getFallbackClient()
}

/**
 * Get or create the singleton Redis client with connection pooling.
 *
 * Connection strategy:
 * 1. Uses ioredis with exponential-backoff reconnection (up to 6 attempts)
 * 2. Periodic health check pings every 30s
 * 3. Falls back to NativeRedisClient/SQLiteCacheEngine when external Redis is unavailable
 * 4. Cooldown: waits 10s after last failure before attempting reconnection
 */
export async function getRedisClient(): Promise<any> {
  if (USE_NATIVE || (!REDIS_URL && !USE_SENTINEL)) {
    return getFallbackClient()
  }

  if (client?.status === 'ready') return client
  if (connecting) return connecting

  // Cooldown: don't hammer with connection attempts after recent failure
  if (Date.now() - lastFailure < 10_000) {
    return getFallbackClient()
  }

  connecting = (async () => {
    try {
      connectionAttempts++
      const Redis = await getRedisConstructor()
      const next = USE_SENTINEL
        ? new Redis(buildConnectionOptions())
        : new Redis(REDIS_URL!, buildConnectionOptions())

      // Track connection lifecycle events
      next.on('connect', () => {
        console.log(`[RedisClient] connected (attempt ${connectionAttempts})`)
      })

      next.on('ready', () => {
        console.log(`[RedisClient] ready — connection established, starting health checks`)
        startHealthCheck(next)
      })

      next.on('end', () => {
        console.warn(`[RedisClient] connection ended`)
        if (client === next) client = null
        connecting = null
      })

      next.on('error', (err: Error) => {
        // ioredis emits 'error' for transient issues during reconnection —
        // don't null the client until 'end' is emitted
        console.warn(`[RedisClient] error: ${err.message}`)
      })

      next.on('reconnecting', () => {
        console.warn(`[RedisClient] reconnecting...`)
      })

      await next.connect()
      client = next
      connectionAttempts = 0
      return client
    } catch (err) {
      lastFailure = Date.now()
      stopHealthCheck()
      console.warn(
        `[RedisClient] connection failed after ${connectionAttempts} attempts — falling back to SQLiteCacheEngine: ${(err as Error)?.message ?? 'unknown error'}`
      )
      return getFallbackClient()
    } finally {
      connecting = null
    }
  })()

  return connecting
}

/**
 * Gracefully close connection and stop health checks.
 */
export async function closeRedis(): Promise<void> {
  stopHealthCheck()
  if (client?.status === 'ready' && typeof client.quit === 'function') {
    await client.quit()
    client = null
  }
  connecting = null
}

/**
 * Create a dedicated Redis client for pub/sub operations.
 * Returns null if Redis is unavailable or in native fallback mode.
 */
export async function createPubSubClient(): Promise<{
  publisher: any
  subscriber: any
} | null> {
  if (USE_NATIVE || !REDIS_URL) return null

  try {
    // Reuse existing client as publisher if available
    const publisher = client?.status === 'ready' ? client : await getRedisClient()
    if (!publisher || typeof publisher.publish !== 'function') return null

    // Create dedicated subscriber connection
    const Redis = await getRedisConstructor()
    const subscriber = USE_SENTINEL
      ? new Redis({
          ...buildConnectionOptions(),
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        })
      : new Redis(REDIS_URL!, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: false,
          connectTimeout: 2000,
          retryStrategy() {
            return null // Don't block — graceful degradation
          },
        })

    return { publisher, subscriber }
  } catch {
    return null
  }
}

/** Returns connection diagnostics for observability. */
export function getRedisConnectionInfo(): {
  connected: boolean
  status: string
  connectionAttempts: number
  nativeFallback: boolean
} {
  return {
    connected: client?.status === 'ready',
    status: client?.status ?? 'disconnected',
    connectionAttempts,
    nativeFallback: USE_NATIVE || !REDIS_URL,
  }
}
