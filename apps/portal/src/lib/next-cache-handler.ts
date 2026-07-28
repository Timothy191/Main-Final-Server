/**
 * Next.js 16 CacheHandler backed by @repo/redis (L2 Redis + tag invalidation).
 *
 * This module exports a plain object matching Next.js 16's CacheHandler interface so that:
 *   - "use cache" directive results are stored in Redis (distributed, shared across pods)
 *   - cacheTag() tags are indexed in Redis for targeted invalidation via updateTags()
 *   - Gracefully degrades to no-op if Redis is unavailable (REDIS_URL not set)
 *
 * Wired in next.config.mjs via:
 *   experimental: { cacheHandlers: { default: require.resolve('./src/lib/next-cache-handler.ts') } }
 */

import { cacheGet, cacheSetWithTags } from '@repo/redis/cache'
import { cacheInvalidateTags } from '@repo/redis/invalidation'

// TTL for cached entries: 5 minutes default (same as Next.js in-memory default)
const DEFAULT_TTL_SECONDS = 300
// Maximum entry size in MiB (configurable via CACHE_MAX_MIB env var)
const MAX_ENTRY_MIB = Number(process.env.CACHE_MAX_MIB ?? 2)
const MAX_ENTRY_BYTES = MAX_ENTRY_MIB * 1024 * 1024

// Redis key prefix for this handler
const KEY_PREFIX = 'portal:cache:'

// Tag manifest key for getExpiration / refreshTags
const TAG_MANIFEST_KEY = 'portal:cache:__tag_manifest__'

interface CacheEntry {
  value: ReadableStream<Uint8Array>
  tags: string[]
  stale: number       // seconds
  timestamp: number   // ms since epoch
  expire: number      // seconds
  revalidate: number  // seconds
}

interface StoredEntry {
  bytes: string        // base64 of Uint8Array chunks concatenated
  tags: string[]
  stale: number
  timestamp: number
  expire: number
  revalidate: number
}
