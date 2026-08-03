/**
 * API Rate Limiting Middleware
 *
 * Provides rate limiting for API endpoints using Redis-backed distributed limiting
 * with in-memory fallback. Supports different limit types per endpoint category.
 */

import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@repo/redis'
import os from 'os'
import { getRateLimitConfig } from './rate-limit-config'

// In-memory store for rate limiting supporting counters and key-value state
class MemoryStore {
  private counters = new Map<string, { count: number; resetTime: number }>()
  private storage = new Map<string, { value: string; expiresAt: number }>()

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const entry = this.counters.get(key)

    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs }
      this.counters.set(key, newEntry)
      return newEntry
    }

    entry.count++
    return entry
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

// Redis store for rate limiting supporting atomic increments and state persistence
class RedisStore {
  constructor(private _redis: Awaited<ReturnType<typeof getRedisClient>>) {}

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const resetTime = now + windowMs

    const result = await this._redis.incr(key)
    if (result === 1) {
      await this._redis.expire(key, Math.ceil(windowMs / 1000))
    }

    return { count: result, resetTime }
  }

  async get(key: string): Promise<string | null> {
    const count = await this._redis.get(key)
    return count ?? null
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))
    await this._redis.set(key, value, 'EX', ttlSeconds)
  }
}

// Token bucket strategy - tracks capacity, tokens, refill rate, and last refill timestamp
class TokenBucketStrategy {
  async check(
    key: string,
    limit: number,
    windowMs: number,
    store: MemoryStore | RedisStore
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const refillRate = limit / windowMs // tokens per ms
    const bucketKey = `${key}:tb`

    const rawState = await store.get(bucketKey)
    let state: { tokens: number; lastRefill: number }

    if (rawState) {
      try {
        state = JSON.parse(rawState)
      } catch {
        state = { tokens: limit, lastRefill: now }
      }
    } else {
      state = { tokens: limit, lastRefill: now }
    }

    // Refill tokens based on elapsed time
    const elapsed = Math.max(0, now - state.lastRefill)
    state.tokens = Math.min(limit, state.tokens + elapsed * refillRate)
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
      limit,
      remaining,
      resetTime: now + (retryAfter ? retryAfter * 1000 : windowMs),
      retryAfter,
    }
  }
}

// Sliding window strategy - tracks timestamp log to prevent boundary bursts
class SlidingWindowStrategy {
  async check(
    key: string,
    limit: number,
    windowMs: number,
    store: MemoryStore | RedisStore
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
      remaining,
      resetTime,
      retryAfter,
    }
  }
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

const WHITELISTED_IPS = new Set(
  (process.env.RATE_LIMIT_IP_WHITELIST || '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',')
    .map((ip) => ip.trim())
)

function isIpWhitelisted(ip: string): boolean {
  return WHITELISTED_IPS.has(ip)
}

function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim()
  if (ip) return ip

  // NextRequest exposes .ip when behind a proxy (Vercel, etc.)
  if (request instanceof NextRequest) {
    const nextIp = (request as unknown as { ip?: string }).ip
    if (nextIp) return nextIp
  }

  return 'unknown'
}

function isSystemUnderHighLoad(): boolean {
  if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_LOAD_ADAPTIVE_TEST) return false
  try {
    const load = os.loadavg()[0] // 1-minute load average
    if (load === undefined) return false
    const cpus = os.cpus().length
    return load / cpus > 0.85 // System load is high if >85% CPU capacity
  } catch {
    return false
  }
}

// Singleton stores and strategies for performance and connection pooling
const globalMemoryStore = new MemoryStore()
let globalRedisStore: RedisStore | null = null

const slidingWindowStrategy = new SlidingWindowStrategy()
const tokenBucketStrategy = new TokenBucketStrategy()

/**
 * Check rate limit for a given identifier and configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: { windowMs: number; maxRequests: number },
  path: string
): Promise<RateLimitResult> {
  let store
  try {
    const redisClient = await getRedisClient()
    if (!globalRedisStore && redisClient) {
      globalRedisStore = new RedisStore(redisClient)
    }
    store = globalRedisStore || globalMemoryStore
  } catch {
    store = globalMemoryStore
  }

  // Token Bucket Strategy for bursty AI calls, Sliding Window for all others
  const strategy = path.startsWith('/api/ai/') ? tokenBucketStrategy : slidingWindowStrategy

  const key = `ratelimit:${identifier}`
  return strategy.check(key, config.maxRequests, config.windowMs, store)
}

/**
 * Extract client identifier from request
 */
function getClientIdentifier(request: Request | NextRequest): string {
  // Try to get real IP, fallback to user ID if authenticated
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = forwarded?.split(',')[0]?.trim() || ('ip' in request ? request.ip : undefined)

  // For authenticated requests, use user ID for more precise limiting
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  return `ip:${realIp || 'unknown'}`
}

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  request: Request | NextRequest,
  handler: () => Promise<NextResponse>,
  options?: {
    customLimit?: { windowMs: number; maxRequests: number }
    skipIf?: (_request: Request | NextRequest) => boolean
  }
): Promise<NextResponse> {
  // Allow disabling rate limit for load testing and development
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return handler()
  }

  // Skip rate limiting if condition is met
  if (options?.skipIf?.(request)) {
    return handler()
  }

  // 1. IP Whitelist Bypass check
  const clientIp = getClientIp(request)
  if (isIpWhitelisted(clientIp)) {
    return handler()
  }

  const path = new URL(request.url).pathname
  let config = options?.customLimit || getRateLimitConfig(path)

  // 2. Load-Adaptive Throttling: Scale down the rate limit if system CPU load is high
  if (isSystemUnderHighLoad()) {
    config = {
      windowMs: config.windowMs,
      maxRequests: Math.max(1, Math.floor(config.maxRequests * 0.5)),
    }
  }

  const identifier = getClientIdentifier(request)
  const result = await checkRateLimit(identifier, config, path)

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${result.retryAfter || 60} seconds.`,
        retryAfter: result.retryAfter || 60,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': (result.retryAfter || 60).toString(),
        },
      }
    )
  }

  const response = await handler()

  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

  return response
}

/**
 * Skip rate limiting for internal requests
 */
export function skipForInternal(request: Request | NextRequest): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  if (!expected) return false

  const internalSecret = request.headers.get('x-internal-secret') || ''
  if (internalSecret.length !== expected.length) return false

  try {
    return timingSafeEqual(Buffer.from(internalSecret), Buffer.from(expected))
  } catch {
    return false
  }
}

/**
 * Reset middleware rate limits (for testing).
 */
export function resetMiddlewareRateLimits(): void {
  globalMemoryStore.clear()
}
