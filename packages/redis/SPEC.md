# @repo/redis — Specification

Two-tiered (L1 In-Memory LRU + L2 Redis) caching system, pub/sub event bus, and TTL category registry.

## 1. Overview & Architecture

`@repo/redis` delivers sub-microsecond cache hits via an in-process LRU cache (L1) while seamlessly synchronizing with Redis (L2). If Redis is unavailable, it operates strictly in native in-memory mode.

---

## 2. Exported Specification

### 2.1 Subpaths & Core Exports

- **`.`**: `redis` Proxy singleton, `getRedis()`, `getNativeRedisClient()`, `getNativeEventBus()`, `CacheCategory`, `CACHE_TTL_REGISTRY`, `cacheGet`, `cacheSet`, `cacheWrap`, `cacheDelete`, `cacheInvalidateTags`
- **`./cache`**: L1/L2 cache wrappers and helpers
- **`./client`**: `ioredis` connection lifecycle management
- **`./stats`**: `getCacheStats()` metric exporter
- **`./invalidation`**: Tag and prefix cache eviction logic

### 2.2 L1 In-Memory Cache Design (`src/l1.ts`)

- **Max Entries:** 1000 items
- **Eviction Policy:** Least Recently Used (LRU) via JavaScript `Map` insertion-order promotion.
- **Tag Index:** Secondary `Map<string, Set<string>>` for fast tag-based invalidations.

### 2.3 Category Registry (`src/registry.ts`)

Pre-configured TTLs and tag generators for system entities (`departments`, `employees`, `machines`, `daily_logs`, `hourly_loads`, `safety_incidents`, etc.).

---

## 3. Dependencies

- `dependencies`: `ioredis` (`^5.4.1`)
