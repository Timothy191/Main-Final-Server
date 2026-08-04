/**
 * Next.js 16 CacheHandler — Redis-backed, wired via top-level `cacheHandlers` in next.config.mjs.
 *
 * Implements the real CacheHandler interface (next/dist/server/lib/cache-handlers/types):
 *   - get(cacheKey, softTags)      → CacheEntry with a ReadableStream value, or undefined
 *   - set(cacheKey, pendingEntry)  → awaits the pending entry, drains its stream, stores in
 *                                    Redis with a per-entry TTL derived from entry.expire
 *   - refreshTags()                → syncs the local tag-timestamp manifest from Redis
 *   - getExpiration(tags)          → max revalidation timestamp for the given tags
 *   - updateTags(tags)             → records revalidation timestamps in Redis (distributed)
 *
 * Distributed tag coordination: revalidateTag() on any pod writes a timestamp under
 * `next:tag:<tag>`; every pod syncs those timestamps in refreshTags() (called before each
 * request) and rejects cache entries older than a tag's revalidation timestamp.
 *
 * Reliability: exponential-backoff retry, circuit breaker with cross-pod pub/sub
 * coordination, and in-memory metrics for Prometheus scraping. All operations gracefully
 * degrade when Redis is unavailable (falls back to NativeRedisClient in-process store).
 */

import type { CacheEntry } from 'next/dist/server/lib/cache-handlers/types'
import { gzipSync, gunzipSync } from 'zlib'

// AGENT-TRACE: Payload compression for Next.js cache handler.
// When enabled, RSC payloads are gzip-compressed before base64 encoding,
// reducing Redis memory usage by 60-80% for typical HTML/RSC content.
const CACHE_HANDLER_COMPRESSION = process.env.CACHE_COMPRESSION === 'true'

// ---------------------------------------------------------------------------
// Keys & TTLs
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'next:cache:'
const TAG_PREFIX = 'next:tag:'
const TAGS_SET_KEY = 'next:revalidated-tags'
// Clamp for entries with INFINITE_CACHE expire (~0xfffffffe seconds)
const MAX_TTL_SECONDS = 7 * 86400
const TAG_TTL_SECONDS = 30 * 86400

// Cached module promise — avoids repeated dynamic import() calls
let clientModule: Promise<typeof import('@repo/redis/client')> | null = null

const LOG_PREFIX = '[CacheHandler]'

// ---------------------------------------------------------------------------
// Metrics — in-memory counters exposed for Prometheus scraping
// ---------------------------------------------------------------------------

interface CacheHandlerMetricsSnapshot {
  getCalls: number
  getHits: number
  getMisses: number
  getErrors: number
  setCalls: number
  setErrors: number
  updateTagsCalls: number
  updateTagsErrors: number
  retries: number
  circuitBreakerOpens: number
  circuitBreakerHalfOpens: number
  circuitBreakerCloses: number
  circuitBreakerRejects: number
}

const metrics = {
  getCalls: 0,
  getHits: 0,
  getMisses: 0,
  getErrors: 0,
  setCalls: 0,
  setErrors: 0,
  updateTagsCalls: 0,
  updateTagsErrors: 0,
  retries: 0,
  circuitBreakerOpens: 0,
  circuitBreakerHalfOpens: 0,
  circuitBreakerCloses: 0,
  circuitBreakerRejects: 0,
}

/** Returns a snapshot of the current cache handler metrics counters. */
export function getCacheHandlerMetrics(): CacheHandlerMetricsSnapshot {
  return { ...metrics }
}

/** Resets all in-memory metrics counters to zero. */
export function resetCacheHandlerMetrics(): void {
  metrics.getCalls = 0
  metrics.getHits = 0
  metrics.getMisses = 0
  metrics.getErrors = 0
  metrics.setCalls = 0
  metrics.setErrors = 0
  metrics.updateTagsCalls = 0
  metrics.updateTagsErrors = 0
  metrics.retries = 0
  metrics.circuitBreakerOpens = 0
  metrics.circuitBreakerHalfOpens = 0
  metrics.circuitBreakerCloses = 0
  metrics.circuitBreakerRejects = 0
}

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  /** Consecutive failures before tripping to OPEN */
  failureThreshold: number
  /** Milliseconds to stay OPEN before transitioning to HALF_OPEN */
  cooldownMs: number
}

const CIRCUIT_DEFAULTS: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 10_000,
}

/** Redis pub/sub channel for cross-pod circuit breaker coordination. */
const CIRCUIT_BREAKER_CHANNEL = 'arch:circuit-breaker:events'

/** Track subscription status to avoid duplicate pub/sub listeners. */
let breakerSubscriptionInitiated = false

interface BreakerPubClient {
  publish(channel: string, message: string): Promise<unknown>
  lpush?(key: string, value: string): Promise<unknown>
  ltrim?(key: string, start: number, stop: number): Promise<unknown>
}

interface BreakerSubClient {
  subscribe(channel: string, cb: (err: Error | null) => void): void
  on(event: string, cb: (channel: string, message: string) => void): void
}

let breakerRedisPub: BreakerPubClient | null = null

/**
 * Lazily initialize the Redis pub/sub connection for cross-pod coordination.
 * Publishes local state changes so all pods sync; subscribes to remote changes.
 */
async function ensureBreakerPubSub(): Promise<void> {
  if (breakerSubscriptionInitiated) return
  breakerSubscriptionInitiated = true

  try {
    const redisClientModule = await import('@repo/redis/client')

    // Use the dedicated pub/sub client factory from @repo/redis/client
    // (handles ioredis dependency internally, avoids fragile cross-package imports)
    const pubSub = await redisClientModule.createPubSubClient()
    if (!pubSub) return // Native fallback or Redis unavailable

    breakerRedisPub = pubSub.publisher as BreakerPubClient
    const sub = pubSub.subscriber as BreakerSubClient

    sub.subscribe(CIRCUIT_BREAKER_CHANNEL, (err: Error | null) => {
      if (err) {
        console.warn(`${LOG_PREFIX} pub/sub subscribe failed: ${err.message}`)
        return
      }
      console.log(
        `${LOG_PREFIX} subscribed to ${CIRCUIT_BREAKER_CHANNEL} for cross-pod coordination`
      )
    })

    sub.on('message', (channel: string, message: string) => {
      if (channel !== CIRCUIT_BREAKER_CHANNEL) return
      try {
        const event = JSON.parse(message) as {
          state: CircuitState
          podId: string
          timestamp: number
        }
        // Ignore events from self
        if (event.podId === BREAKER_POD_ID) return

        console.warn(
          `${LOG_PREFIX} cross-pod circuit breaker event received: ${event.state} from pod ${event.podId.slice(0, 8)}`
        )

        switch (event.state) {
          case 'OPEN':
            circuitBreaker.forceOpen()
            break
          case 'HALF_OPEN':
            if (circuitBreaker.getState() === 'OPEN') {
              circuitBreaker.forceHalfOpen()
            }
            break
          case 'CLOSED':
            circuitBreaker.reset()
            break
        }
      } catch {
        // Malformed message — ignore
      }
    })
  } catch {
    // Pub/sub setup failed — run independently (graceful degradation)
  }
}

/** Unique identifier for this pod/process instance. */
const BREAKER_POD_ID = `pod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

/** Key for the centralized audit log list in Redis. */
const CIRCUIT_BREAKER_AUDIT_KEY = 'arch:circuit-breaker:audit'

/** Maximum audit log entries to keep in Redis (oldest trimmed first). */
const CIRCUIT_BREAKER_AUDIT_MAX = 10_000

// ---------------------------------------------------------------------------
// Audit log rate limiter — sliding window per state
// ---------------------------------------------------------------------------

interface RateLimitBucket {
  /** Timestamps of recent events in ms */
  timestamps: number[]
}

/** Max audit events per state type per window. */
const AUDIT_RATE_LIMIT_MAX = 5

/** Sliding window in ms (10 seconds). */
const AUDIT_RATE_LIMIT_WINDOW_MS = 10_000

/** Per-state rate limit buckets. */
const auditRateBuckets: Record<string, RateLimitBucket> = {
  OPEN: { timestamps: [] },
  HALF_OPEN: { timestamps: [] },
  CLOSED: { timestamps: [] },
}

/**
 * Check if an audit event for the given state should be published,
 * based on sliding-window rate limiting.
 */
function allowAuditEvent(state: CircuitState): boolean {
  const now = Date.now()
  const bucket = auditRateBuckets[state]
  if (!bucket) return true // Unknown state — allow

  // Prune expired timestamps
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < AUDIT_RATE_LIMIT_WINDOW_MS)

  if (bucket.timestamps.length >= AUDIT_RATE_LIMIT_MAX) {
    return false // Rate limited
  }

  bucket.timestamps.push(now)
  return true
}

/** Reset audit rate limit buckets (for testing). */
export function resetAuditRateLimitBuckets(): void {
  for (const key of Object.keys(auditRateBuckets)) {
    auditRateBuckets[key]!.timestamps = []
  }
}

/**
 * Build the audit event payload for a circuit breaker state change.
 */
function buildBreakerAuditEvent(state: CircuitState) {
  return JSON.stringify({
    state,
    podId: BREAKER_POD_ID,
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    failureCount: circuitBreaker.getFailureCount(),
  })
}

/**
 * Publish a circuit breaker state change to:
 *   1. All pods via Redis pub/sub (real-time cross-pod coordination)
 *   2. A Redis list for centralized audit logging (persistent, rate-limited)
 * Fire-and-forget — failures are silently ignored.
 */
function publishBreakerEvent(state: CircuitState): void {
  const payload = buildBreakerAuditEvent(state)

  // 1. Real-time cross-pod coordination via pub/sub (always allowed)
  if (breakerRedisPub && typeof breakerRedisPub.publish === 'function') {
    breakerRedisPub.publish(CIRCUIT_BREAKER_CHANNEL, payload).catch(() => {
      // Fire-and-forget
    })
  }

  // 2. Persistent audit log via Redis list (rate-limited to prevent flooding)
  if (allowAuditEvent(state)) {
    const pub = breakerRedisPub
    if (pub && typeof pub.lpush === 'function' && typeof pub.ltrim === 'function') {
      Promise.all([
        pub.lpush(CIRCUIT_BREAKER_AUDIT_KEY, payload),
        pub.ltrim(CIRCUIT_BREAKER_AUDIT_KEY, 0, CIRCUIT_BREAKER_AUDIT_MAX - 1),
      ]).catch(() => {
        // Fire-and-forget
      })
    }
  }
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private lastFailureTime = 0
  private config: Required<CircuitBreakerConfig>

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...CIRCUIT_DEFAULTS, ...config }
    // Init pub/sub lazily on first use
  }

  /** Returns the current state label for metrics. */
  getState(): CircuitState {
    // Auto-transition OPEN → HALF_OPEN after cooldown
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime >= this.config.cooldownMs) {
      this.state = 'HALF_OPEN'
      metrics.circuitBreakerHalfOpens++
      publishBreakerEvent('HALF_OPEN')
      console.warn(`${LOG_PREFIX} circuit breaker HALF_OPEN — allowing probe request`)
    }
    return this.state
  }

  /**
   * Call before each Redis operation.
   * Returns true if the request should proceed, false to fast-fail.
   */
  allowRequest(): boolean {
    // Ensure pub/sub is initialized on first use (fire-and-forget)
    ensureBreakerPubSub().catch(() => {})

    const st = this.getState()
    if (st === 'CLOSED') return true
    if (st === 'HALF_OPEN') return true // allow probe
    // OPEN — fast-fail
    metrics.circuitBreakerRejects++
    return false
  }

  /** Call after a successful Redis operation. */
  onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      metrics.circuitBreakerCloses++
      publishBreakerEvent('CLOSED')
      console.warn(`${LOG_PREFIX} circuit breaker CLOSED — Redis recovered`)
    }
    this.failureCount = 0
  }

  /** Call after a failed Redis operation. */
  onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      if (this.state !== 'OPEN') {
        this.state = 'OPEN'
        metrics.circuitBreakerOpens++
        publishBreakerEvent('OPEN')
        console.warn(
          `${LOG_PREFIX} circuit breaker OPEN — ${this.failureCount} consecutive failures, blocking for ${this.config.cooldownMs}ms`
        )
      }
    }
  }

  /** Force-reset to CLOSED (e.g., after connection recovery). */
  reset(): void {
    if (this.state !== 'CLOSED') {
      this.state = 'CLOSED'
      this.failureCount = 0
      this.lastFailureTime = 0
      publishBreakerEvent('CLOSED')
    }
  }

  /** Force OPEN (used by cross-pod coordination). */
  forceOpen(): void {
    if (this.state !== 'OPEN') {
      this.state = 'OPEN'
      this.failureCount = this.config.failureThreshold
      this.lastFailureTime = Date.now()
      console.warn(`${LOG_PREFIX} circuit breaker forced OPEN by cross-pod event`)
    }
  }

  /** Force HALF_OPEN (used by cross-pod coordination). */
  forceHalfOpen(): void {
    if (this.state === 'OPEN') {
      this.state = 'HALF_OPEN'
      metrics.circuitBreakerHalfOpens++
      console.warn(`${LOG_PREFIX} circuit breaker forced HALF_OPEN by cross-pod event`)
    }
  }

  /** Get current consecutive failure count. */
  getFailureCount(): number {
    return this.failureCount
  }
}

/** Singleton circuit breaker for the cache handler. */
const circuitBreaker = new CircuitBreaker()

/** Returns the current circuit breaker state for diagnostics. */
export function getCircuitBreakerState(): CircuitState {
  return circuitBreaker.getState()
}

/** Force-resets the circuit breaker to CLOSED (e.g., after connection recovery). */
export function resetCircuitBreaker(): void {
  circuitBreaker.reset()
}

// ---------------------------------------------------------------------------
// Retry utility — exponential backoff with jitter
// ---------------------------------------------------------------------------

interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  onRetry?: (attempt: number, delayMs: number, error: Error) => void
}

async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 200, maxDelayMs = 5000, onRetry } = options
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries) {
        const rawDelay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs)
        const jitter = rawDelay * (0.2 * (Math.random() * 2 - 1)) // ±20%
        const delay = Math.round(rawDelay + jitter)
        onRetry?.(attempt + 1, delay, lastError)
        metrics.retries++
        console.warn(
          `${LOG_PREFIX} retry ${attempt + 1}/${maxRetries} in ${delay}ms — ${lastError.message}`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new Error('withRetry: unexpected empty error')
}

// ---------------------------------------------------------------------------
// Retry config
// ---------------------------------------------------------------------------

const RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
}

// ---------------------------------------------------------------------------
// Lazy Redis client getter
// ---------------------------------------------------------------------------

/** Minimal structural view of the Redis client (ioredis or NativeRedisClient). */
interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode: string, ttl: number): Promise<unknown>
  sadd(key: string, member: string): Promise<unknown>
  smembers?(key: string): Promise<string[]>
  mget?(keys: string[]): Promise<Array<string | null>>
}

async function getRedis(): Promise<RedisLike | null> {
  try {
    if (!clientModule) {
      clientModule = import('@repo/redis/client')
    }
    const { getRedisClient } = await clientModule
    return ((await getRedisClient()) as RedisLike | null) ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Tag timestamps & in-flight set tracking
// ---------------------------------------------------------------------------

/** Local manifest of tag → last revalidation timestamp (ms), synced via refreshTags(). */
const localTagTimestamps = new Map<string, number>()

/** In-flight set() promises — get() for the same key must wait for them. */
const pendingSets = new Map<string, Promise<void>>()

/** Serialized shape stored in Redis. */
interface StoredEntry {
  /** base64-encoded entry payload (gzip-compressed when compressed: true) */
  value: string
  tags: string[]
  stale: number
  timestamp: number
  expire: number
  revalidate: number
  /** When true, value is gzip-compressed before base64 encoding */
  compressed?: boolean
}

function isStaleByTags(entry: StoredEntry, softTags: string[]): boolean {
  for (const tag of [...entry.tags, ...softTags]) {
    const revalidatedAt = localTagTimestamps.get(tag)
    if (revalidatedAt !== undefined && revalidatedAt >= entry.timestamp) {
      return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// Public API — Next.js 16 CacheHandler interface
// ---------------------------------------------------------------------------

/**
 * Retrieve a cache entry. Returns undefined on miss, expiry, tag staleness,
 * or any Redis failure — this function must never throw.
 */
export async function get(
  cacheKey: string,
  softTags: string[] = []
): Promise<CacheEntry | undefined> {
  metrics.getCalls++

  try {
    // Wait for a pending set() on the same key before reading
    await pendingSets.get(cacheKey)

    if (!circuitBreaker.allowRequest()) {
      metrics.getErrors++
      return undefined
    }

    const redis = await getRedis()
    if (!redis) {
      metrics.getMisses++
      return undefined
    }

    const raw: string | null = await withRetry(
      () => redis.get(KEY_PREFIX + cacheKey),
      RETRY_OPTIONS
    )
    circuitBreaker.onSuccess()

    if (!raw) {
      metrics.getMisses++
      return undefined
    }

    const stored = JSON.parse(raw) as StoredEntry
    if (Date.now() > stored.timestamp + stored.expire * 1000 || isStaleByTags(stored, softTags)) {
      metrics.getMisses++
      return undefined
    }

    metrics.getHits++
    let payloadBuf = Buffer.from(stored.value, 'base64')
    // Decompress if stored with compression (graceful mixed-era support)
    if (stored.compressed) {
      try {
        payloadBuf = gunzipSync(payloadBuf)
      } catch {
        // If decompression fails, return undefined (treat as cache miss)
        metrics.getMisses++
        metrics.getHits--
        return undefined
      }
    }
    const payload = new Uint8Array(payloadBuf)
    return {
      value: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(payload)
          controller.close()
        },
      }),
      tags: stored.tags,
      stale: stored.stale,
      timestamp: stored.timestamp,
      expire: stored.expire,
      revalidate: stored.revalidate,
    }
  } catch {
    metrics.getErrors++
    circuitBreaker.onFailure()
    return undefined
  }
}

/**
 * Store a pending cache entry. Awaits the entry, drains its value stream, and
 * persists it in Redis with a TTL derived from the entry's own `expire`
 * duration (cacheLife profile), clamped to MAX_TTL_SECONDS.
 */
export async function set(cacheKey: string, pendingEntry: Promise<CacheEntry>): Promise<void> {
  metrics.setCalls++

  let release: () => void = () => {}
  pendingSets.set(
    cacheKey,
    new Promise<void>((resolve) => {
      release = resolve
    })
  )

  try {
    const entry = await pendingEntry

    // Drain the (possibly still-streaming) value into memory
    const reader = entry.value.getReader()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }

    if (!circuitBreaker.allowRequest()) {
      metrics.setErrors++
      return
    }

    const redis = await getRedis()
    if (!redis) return

    const ttlSeconds = Number.isFinite(entry.expire)
      ? Math.min(Math.max(1, Math.ceil(entry.expire)), MAX_TTL_SECONDS)
      : MAX_TTL_SECONDS

    const rawBuf = Buffer.concat(chunks)
    let storedValue: string
    let isCompressed = false
    if (CACHE_HANDLER_COMPRESSION) {
      try {
        storedValue = gzipSync(rawBuf).toString('base64')
        isCompressed = true
      } catch {
        // Compression failed — fall back to uncompressed
        storedValue = rawBuf.toString('base64')
      }
    } else {
      storedValue = rawBuf.toString('base64')
    }

    const stored: StoredEntry = {
      value: storedValue,
      tags: entry.tags,
      stale: entry.stale,
      timestamp: entry.timestamp,
      expire: entry.expire,
      revalidate: entry.revalidate,
      ...(isCompressed && { compressed: true }),
    }

    await withRetry(
      () => redis.set(KEY_PREFIX + cacheKey, JSON.stringify(stored), 'EX', ttlSeconds),
      RETRY_OPTIONS
    )
    circuitBreaker.onSuccess()
  } catch {
    metrics.setErrors++
    circuitBreaker.onFailure()
    console.warn(`${LOG_PREFIX} set(${cacheKey}) failed — Redis unavailable, cache degraded`)
  } finally {
    release()
    pendingSets.delete(cacheKey)
  }
}

/**
 * Sync the local tag-timestamp manifest from Redis. Called by Next.js before
 * each request — this is what makes revalidateTag() distributed across pods.
 */
export async function refreshTags(): Promise<void> {
  try {
    const redis = await getRedis()
    // NativeRedisClient (in-process fallback) lacks smembers/mget; the local
    // manifest is already authoritative in a single-process deployment.
    if (!redis || typeof redis.smembers !== 'function' || typeof redis.mget !== 'function') {
      return
    }

    const tags: string[] = await redis.smembers(TAGS_SET_KEY)
    if (!tags || tags.length === 0) return

    const values: Array<string | null> = await redis.mget(
      tags.map((tag: string) => TAG_PREFIX + tag)
    )
    tags.forEach((tag, i) => {
      const value = values[i]
      if (value) localTagTimestamps.set(tag, Number(value))
    })
  } catch {
    // Stale local manifest is acceptable — entries expire by TTL regardless
  }
}

/**
 * Maximum revalidation timestamp for the given tags, or 0 if none were ever
 * revalidated. Required by the CacheHandler interface.
 */
export async function getExpiration(tags: string[]): Promise<number> {
  let max = 0
  for (const tag of tags) {
    max = Math.max(max, localTagTimestamps.get(tag) ?? 0)
  }
  return max
}

/**
 * Record revalidation timestamps for the given tags — locally and in Redis so
 * other pods pick them up via refreshTags().
 */
export async function updateTags(tags: string[], _durations?: { expire?: number }): Promise<void> {
  metrics.updateTagsCalls++

  const now = Date.now()
  for (const tag of tags) {
    localTagTimestamps.set(tag, now)
  }

  if (!circuitBreaker.allowRequest()) {
    metrics.updateTagsErrors++
    return
  }

  try {
    const redis = await getRedis()
    if (!redis) return

    await withRetry(async () => {
      for (const tag of tags) {
        await redis.set(TAG_PREFIX + tag, String(now), 'EX', TAG_TTL_SECONDS)
        await redis.sadd(TAGS_SET_KEY, tag)
      }
    }, RETRY_OPTIONS)
    circuitBreaker.onSuccess()
  } catch (err) {
    metrics.updateTagsErrors++
    circuitBreaker.onFailure()
    console.warn(
      `${LOG_PREFIX} updateTags([${tags.length} tags]) failed — ${(err as Error)?.message ?? 'unknown error'}`
    )
  }
}
