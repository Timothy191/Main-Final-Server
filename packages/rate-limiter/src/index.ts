/**
 * @repo/rate-limiter — lightweight Redis-backed & in-memory rate limiter
 *
 * Usage:
 *   import { RateLimiter, RedisStore, FixedWindowStrategy, TokenBucketStrategy, SlidingWindowStrategy } from "@repo/rate-limiter";
 *   import { getRedisClient } from "@repo/redis";
 *
 *   const store = new RedisStore(redis);
 *   const strategy = new SlidingWindowStrategy();
 *   const limiter = new RateLimiter({ store, strategy, limit: 10, windowMs: 60000 });
 *   const result = await limiter.check("user-or-resource-id");
 *   if (!result.allowed) { handleRateLimit(); }
 */

/** Minimal Redis client interface for the rate limiter. */
export interface SimpleRedisClient {
  status?: string
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>
  incr?(key: string): Promise<number>
  expire?(key: string, seconds: number): Promise<unknown>
}

/** Rate limit check result. */
export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
  remaining?: number
  total?: number
  limit?: number
  resetTime?: number
}

/** Storage backend interface. */
export interface Store {
  increment(key: string, windowMs: number): Promise<{ current: number; ttl: number }>
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlMs: number): Promise<void>
}

/**
 * In-memory store supporting counter increments and key-value state.
 */
export class MemoryStore implements Store {
  private counters = new Map<string, { current: number; expiresAt: number }>()
  private storage = new Map<string, { value: string; expiresAt: number }>()

  async increment(key: string, windowMs: number): Promise<{ current: number; ttl: number }> {
    const now = Date.now()
    const entry = this.counters.get(key)

    if (!entry || now > entry.expiresAt) {
      const expiresAt = now + windowMs
      this.counters.set(key, { current: 1, expiresAt })
      return { current: 1, ttl: Math.ceil(windowMs / 1000) }
    }

    entry.current++
    const ttl = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))
    return { current: entry.current, ttl }
  }

  async get(key: string): Promise<string | null> {
    const now = Date.now()
    const entry = this.storage.get(key)
    if (!entry) return null
    if (now > entry.expiresAt) {
      this.storage.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    const expiresAt = Date.now() + ttlMs
    this.storage.set(key, { value, expiresAt })
  }

  clear(): void {
    this.counters.clear()
    this.storage.clear()
  }
}

/**
 * Redis-backed store using atomic INCR + EXPIRE and key-value state.
 */
export class RedisStore implements Store {
  constructor(private client: SimpleRedisClient) {}

  async increment(key: string, windowMs: number): Promise<{ current: number; ttl: number }> {
    const now = Date.now()
    const multiKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`
    const ttlSeconds = Math.ceil(windowMs / 1000)

    if (typeof this.client.incr === 'function') {
      const count = await this.client.incr(multiKey)
      if (count === 1 && typeof this.client.expire === 'function') {
        await this.client.expire(multiKey, ttlSeconds)
      }
      return { current: count, ttl: ttlSeconds }
    }

    const current = await this.client.get(multiKey)
    const count = current ? Number.parseInt(current, 10) + 1 : 1
    await this.client.set(multiKey, String(count), 'EX', ttlSeconds)

    return { current: count, ttl: ttlSeconds }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))
    await this.client.set(key, value, 'EX', ttlSeconds)
  }
}

/**
 * Fixed window strategy — counts requests in wall-clock windows.
 */
export class FixedWindowStrategy {
  async check(
    key: string,
    limit: number,
    windowMs: number,
    store: Store
  ): Promise<RateLimitResult> {
    const { current, ttl } = await store.increment(key, windowMs)
    const allowed = current <= limit

    return {
      allowed,
      limit,
      total: limit,
      remaining: Math.max(0, limit - current),
      retryAfter: allowed ? undefined : ttl,
      resetTime: Date.now() + ttl * 1000,
    }
  }
}

/**
 * Token Bucket Strategy — handles bursty traffic while refilling tokens continuously.
 * Tracks tokens, capacity, refill rate, and last refill timestamp.
 */
export class TokenBucketStrategy {
  async check(
    key: string,
    capacity: number,
    windowMs: number,
    store: Store
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const refillRate = capacity / windowMs // tokens per ms
    const bucketKey = `${key}:tb`

    const rawState = await store.get(bucketKey)
    let state: { tokens: number; lastRefill: number }

    if (rawState) {
      try {
        state = JSON.parse(rawState)
      } catch {
        state = { tokens: capacity, lastRefill: now }
      }
    } else {
      state = { tokens: capacity, lastRefill: now }
    }

    // Refill tokens based on elapsed time
    const elapsed = Math.max(0, now - state.lastRefill)
    state.tokens = Math.min(capacity, state.tokens + elapsed * refillRate)
    state.lastRefill = now

    let allowed = false
    let remaining = 0
    let retryAfter: number | undefined

    if (state.tokens >= 1) {
      state.tokens -= 1
      allowed = true
      remaining = Math.floor(state.tokens)
    } else {
      allowed = false
      remaining = 0
      const missing = 1 - state.tokens
      retryAfter = Math.max(1, Math.ceil(missing / refillRate / 1000))
    }

    await store.set(bucketKey, JSON.stringify(state), windowMs * 2)

    return {
      allowed,
      limit: capacity,
      total: capacity,
      remaining,
      retryAfter,
      resetTime: now + (retryAfter ? retryAfter * 1000 : windowMs),
    }
  }
}

/**
 * Sliding Window Strategy — prevents boundary bursts using a sliding window log.
 */
export class SlidingWindowStrategy {
  async check(
    key: string,
    limit: number,
    windowMs: number,
    store: Store
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowKey = `${key}:sw`
    const windowStart = now - windowMs

    const rawLogs = await store.get(windowKey)
    let timestamps: number[] = []

    if (rawLogs) {
      try {
        const parsed = JSON.parse(rawLogs)
        if (Array.isArray(parsed)) {
          timestamps = parsed.filter((ts) => typeof ts === 'number' && ts > windowStart)
        }
      } catch {
        timestamps = []
      }
    }

    let allowed = false
    let remaining = 0
    let retryAfter: number | undefined
    let resetTime = now + windowMs

    if (timestamps.length < limit) {
      timestamps.push(now)
      allowed = true
      remaining = limit - timestamps.length
      const firstTs = timestamps[0] ?? now
      resetTime = firstTs + windowMs
    } else {
      allowed = false
      remaining = 0
      const oldestTs = timestamps[0] ?? now
      retryAfter = Math.max(1, Math.ceil((oldestTs + windowMs - now) / 1000))
      resetTime = oldestTs + windowMs
    }

    await store.set(windowKey, JSON.stringify(timestamps), windowMs * 2)

    return {
      allowed,
      limit,
      total: limit,
      remaining,
      retryAfter,
      resetTime,
    }
  }
}

/** Rate limiter configuration. */
export interface RateLimiterConfig {
  store: Store
  strategy: FixedWindowStrategy | TokenBucketStrategy | SlidingWindowStrategy
  limit: number
  windowMs: number
  keyPrefix?: string
}

/**
 * Rate limiter — checks if a request is within the configured limits.
 */
export class RateLimiter {
  private store: Store
  private strategy: FixedWindowStrategy | TokenBucketStrategy | SlidingWindowStrategy
  private limit: number
  private windowMs: number
  private keyPrefix: string

  constructor(config: RateLimiterConfig) {
    this.store = config.store
    this.strategy = config.strategy
    this.limit = config.limit
    this.windowMs = config.windowMs
    this.keyPrefix = config.keyPrefix ?? 'ratelimit:'
  }

  /**
   * Check if the given identifier is allowed within the rate limit window.
   * Returns whether the request is allowed and how long to wait if not.
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.keyPrefix}${identifier}`

    try {
      if (this.strategy && typeof (this.strategy as { check?: Function }).check === 'function') {
        return await (this.strategy as { check: Function }).check(
          key,
          this.limit,
          this.windowMs,
          this.store
        )
      }

      const { current, ttl } = await this.store.increment(key, this.windowMs)
      const allowed = current <= this.limit

      return {
        allowed,
        limit: this.limit,
        total: this.limit,
        remaining: Math.max(0, this.limit - current),
        retryAfter: allowed ? undefined : ttl,
        resetTime: Date.now() + ttl * 1000,
      }
    } catch {
      // If store is unavailable, allow the request through
      return { allowed: true, remaining: 1, total: this.limit, limit: this.limit }
    }
  }
}
