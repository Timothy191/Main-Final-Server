---
name: redis-caching
description: >-
  MUST auto-delegate for L1/L2 cache design, cacheWrap usage, stampede prevention,
  or cache invalidation in apps/portal via @repo/redis. Anti-trigger: generic
  tasks, UI work, security audits, database index tuning.
---

# Redis Caching

Double-tier (L1 memory + L2 Redis) caching via `@repo/redis`.

## When to use

- High read-to-write ratio queries (config, profiles, department lists)
- Sub-millisecond hot paths with L1 + L2 fallback
- Stampede prevention with `cacheWrap` single-flight
- Tag/prefix invalidation after mutations

## Workflow

1. Prefer `cacheWrap` for compute-heavy reads — see [`references/patterns.md`](references/patterns.md)
2. Set TTL: L1 short (≤30s), L2 longer; never cache auth/session data
3. Invalidate on write with `cacheDel` / `cacheDelByPrefix`
4. Verify cache keys do not leak cross-tenant data

## Package

`@repo/redis` — `cacheGet`, `cacheSet`, `cacheWrap`, `cacheDel`, `cacheDelByPrefix`

## Gotchas

- Redis client connection failures on `ioredis.connect` — verify `REDIS_URL` and local Redis before blaming cache logic
