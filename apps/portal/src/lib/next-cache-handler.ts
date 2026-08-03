/**
 * Next.js 16 CacheHandler backed by @repo/redis (L2 Redis + tag invalidation).
 *
 * This class implements the Next.js CacheHandler interface so that:
 *   - `"use cache"` directive results are stored in Redis (distributed, shared across pods)
 *   - `cacheTag()` tags are indexed in Redis for targeted invalidation via `revalidateTag()`
 *   - Gracefully degrades to no-op if Redis is unavailable (REDIS_URL not set)
 *
 * Wired in next.config.mjs via:
 *   experimental: { cacheHandlers: { default: require.resolve('./src/lib/next-cache-handler.ts') } }
 */

import { cacheGet, cacheSetWithTags } from '@repo/redis/cache'
import { cacheInvalidateTags } from '@repo/redis/invalidation'

// TTL for cached entries: 5 minutes default (same as Next.js in-memory default)
const DEFAULT_TTL_SECONDS = 300

interface CacheHandlerContext {
  tags?: string[]
  revalidate?: number | false
}

interface CacheHandlerValue {
  value: unknown
  lastModified: number
  tags: string[]
}

export default class NextCacheHandler {
  // Per-request in-memory cache reset by Next.js before each request
  private requestCache = new Map<string, CacheHandlerValue>()

  /**
   * Retrieve a cached entry by key.
   * Checks request-scoped cache first, then L2 Redis.
   */
  async get(key: string): Promise<CacheHandlerValue | null> {
    // 1. Check per-request in-memory cache
    const inFlight = this.requestCache.get(key)
    if (inFlight) return inFlight

    // 2. Check L2 Redis (with silent fallback on unavailability)
    try {
      const cached = await cacheGet<CacheHandlerValue>(key)
      return cached ?? null
    } catch {
      // Redis unavailable — degrade gracefully, Next.js will re-fetch
      return null
    }
  }

  /**
   * Store a cached entry with its associated tags.
   * Persists to Redis and indexes tags for future invalidation.
   */
  async set(key: string, data: unknown, ctx: CacheHandlerContext): Promise<void> {
    const tags = ctx.tags ?? []
    const ttl =
      typeof ctx.revalidate === 'number' && ctx.revalidate > 0
        ? ctx.revalidate
        : DEFAULT_TTL_SECONDS

    const entry: CacheHandlerValue = {
      value: data,
      lastModified: Date.now(),
      tags,
    }

    // Store in per-request cache for immediate subsequent reads
    this.requestCache.set(key, entry)

    // Persist to Redis with TTL + tag index (best-effort, silent on failure)
    try {
      await cacheSetWithTags(key, entry, ttl, tags)
    } catch {
      // Redis unavailable — per-request cache still serves this request
    }
  }

  /**
   * Invalidate all cache entries associated with the given tag(s).
   * Delegates to @repo/redis tag-based invalidation (SSCAN + UNLINK).
   */
  async revalidateTag(tags: string | string[]): Promise<void> {
    const tagArray = Array.isArray(tags) ? tags : [tags]

    try {
      await cacheInvalidateTags(tagArray)
    } catch {
      // Silent fail — stale data is acceptable vs. crashing the revalidation path
    }
  }

  /**
   * Reset per-request in-memory cache.
   * Called by Next.js at the start of each request.
   */
  resetRequestCache(): void {
    this.requestCache.clear()
  }
}
