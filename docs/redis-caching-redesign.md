# Redis Caching Redesign: Lightweight, Functional, Native to Server

**Date:** 2026-07-19
**Status:** Proposal — pending implementation

## Current Architecture

```
@repo/redis
├── index.ts         # Legacy API: redis proxy, getRedis, getRedisClient, CacheCategory, cacheWrap, cacheGet/Set
├── client.ts        # Singleton: getRedisClient() with ioredis
├── invalidation.ts  # cacheInvalidateTags, cacheInvalidatePrefixes
├── stats.ts         # getCacheStats
└── cache.ts         # (future)
```

**Problems:**

1. **Two overlapping clients** — `index.ts` creates its own singleton (`_client`), `client.ts` creates another (`client`). They can connect independently with different configs.
2. **Legacy `redis` Proxy** — `export const redis = new Proxy({} as Redis, ...)` defers property access to `getRedis()` but breaks IDE autocomplete and hides method signatures.
3. **No unified cache interface** — `cacheWrap`, `cacheGet`, `cacheSet` are loose functions, not a class. No connection pooling awareness, no circuit breaker, no graceful degradation.
4. **Heavy ioredis** — ioredis (~800KB) is a full-featured Redis client. It supports sentinel/cluster, but this project always connects to a single Redis URL.

## Proposed Design: `@repo/redis` v2

### Principle: One client, one interface, graceful degradation

```typescript
// @repo/redis/src/cache.ts — Target API

interface CacheOptions {
  ttl?: number // seconds — default 3600
  tags?: string[] // for tag-based invalidation
  prefix?: string // key namespace — e.g. "hub", "auth"
}

interface CacheEntry<T> {
  value: T
  cachedAt: number
  ttl: number
}

export class Cache {
  constructor(private url: string = process.env.REDIS_URL ?? '') {}

  // Typed get/set
  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, opts?: CacheOptions): Promise<void>

  // Cache-aside with fn fallback
  async wrap<T>(key: string, fn: () => Promise<T>, opts?: CacheOptions): Promise<T>

  // Invalidation
  async invalidateTags(tags: string[]): Promise<number>
  async invalidatePrefix(prefix: string): Promise<number>
  async clear(): Promise<void>

  // Observability
  get isConnected(): boolean
  get stats(): CacheStats
}

// Global singleton (lazy, graceful)
export const cache = new Cache()
```

### Key Design Decisions

| Decision                   | Choice                                                | Rationale                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client library**         | `ioredis` (keep)                                      | Already installed, works. Switch to `redis` (v4) if bundle size becomes an issue, but ioredis API is more ergonomic.                                                             |
| **Singleton**              | Single `Cache` instance                               | Eliminates duplicate connections. One `getRedis()` → no duplicate singletons.                                                                                                    |
| **Graceful degradation**   | Cache miss on connection error                        | `try/catch` every Redis call; if Redis is down, `wrap()` always calls `fn()`, `invalidates` are no-ops with warning log. The app never crashes due to Redis.                     |
| **Tag-based invalidation** | `cache:tag:{tag}` keys pointing to sets of cache keys | Replace current approach. `set()` writes tag membership atomically via `SADD`. `invalidateTags()` scans and deletes. Trade-off: `SADD` per write, `SCAN` + `DEL` per invalidate. |
| **Key naming**             | `{prefix}:{key}`                                      | Structured keys enable prefix-based cleanup. Add a maximum key length check.                                                                                                     |
| **Serialization**          | `JSON.stringify` / `JSON.parse`                       | Simple, fast enough for JSON payloads. BigInt/circular refs not needed.                                                                                                          |
| **TTL**                    | Per-entry, default 3600s (1h)                         | `cacheWrap` now accepts `{ ttl }` option. No TTL = no expiry.                                                                                                                    |

### Migration Path

```
Phase 1: Add Cache class alongside legacy API (non-breaking)
Phase 2: Migrate callers to cache.wrap() — one file at a time
Phase 3: Deprecate legacy exports (cacheWrap, cacheGet, cacheSet, redis proxy)
Phase 4: Remove legacy code
```

### Caller Migration Example

**Before:**

```typescript
import { cacheWrap, cacheGet, cacheSet, CacheCategory } from '@repo/redis'

// Portal hub
const data = await cacheWrap('hub:counts', async () => fetchCounts())
```

**After:**

```typescript
import { cache } from '@repo/redis'

// Portal hub
const data = await cache.wrap('hub:counts', async () => fetchCounts(), {
  ttl: 300,
  tags: ['table:safety_incidents', 'table:breakdowns'],
  prefix: 'hub',
})
```

### Native to Server — Edge Compatibility

Since this is a Next.js 16 server environment:

- **No `use cache` directive integration** — `cache.wrap()` works in Server Components, Server Actions, and API routes.
- **No `await cache()` outside of React** — All methods are idiomatic async/await.
- **Read replicas** — The Cache class only handles Redis. Database read replicas (`@repo/supabase/read-replica`) remain a separate concern.

### Success Metrics

| Metric                      | Target                                                                 |
| --------------------------- | ---------------------------------------------------------------------- |
| Time to first byte (portal) | < 200ms with warm cache                                                |
| Cache hit ratio             | > 80% for METRICS category                                             |
| Redis memory usage          | < 50MB                                                                 |
| Connection count            | 1 (was 2)                                                              |
| Bundle size (ioredis)       | ~800KB — accept for now; evaluate `@upstash/redis` if size is critical |
