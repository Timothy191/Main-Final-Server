# Arch System — Agent Caching Specification

Comprehensive agent reference for caching architectures, L1/L2 Redis invalidation, edge proxy auth caching, and Next.js 16 `"use cache"` boundaries.

## 1. Overview & Architecture

System caching is divided into three distinct layers:

1. **Edge Proxy Auth Cache:** Evaluates employee authorization at `proxy.ts`. Caches employee roles under `arch:auth:employee:<userId>` with 300s Redis L2 TTL and 30s L1 in-process TTL.
2. **Next.js 16 Data Cache:** Uses `"use cache"` and `cacheTag(...)` for server component data fetching.
3. **Application Cache (`@repo/redis`):** Two-tiered L1 (in-process LRU) + L2 (Redis cluster) singleton for high-frequency queries.

---

## 2. Invalidation & Eviction Hooks

- **Role Change Invalidation:** `POST /api/cache/invalidate` accepts `{ userId: string }`. Calling this executes `cacheDelete('arch:auth:employee:<userId>')` which evicts both L1 and L2 immediately (ADR-001).
- **Tag Revalidation:** `revalidateTag(DEPARTMENT_CACHE_TAGS.<SLUG>)` invalidates server component data caches across pods.

---

## 3. Agent Rules & Constraints

- **Edge Safety:** `proxy.ts` must never attempt async Redis calls directly; it reads from L1/L2 via edge-safe mechanisms or HTTP endpoints.
- **Context Isolation:** Do not pass un-serializable objects (like Supabase client instances or HTTP Request objects) into `"use cache"` functions.
