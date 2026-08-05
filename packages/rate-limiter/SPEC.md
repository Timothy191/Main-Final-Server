# @repo/rate-limiter — Specification

Lightweight, multi-strategy rate limiter supporting in-memory and Redis storage backends.

## 1. Overview & Architecture

`@repo/rate-limiter` prevents API abuse and controls system throughput in edge middleware and route handlers. It provides fallback tolerance (allowing requests through if storage fails).

---

## 2. Exported Specification

### 2.1 Storage Backends

- **`MemoryStore`:** In-process `Map` storage with TTL expiration cleanup.
- **`RedisStore`:** High-throughput Redis store using `INCR` + `EXPIRE` commands via `SimpleRedisClient`.

### 2.2 Rate Limiting Strategies

1. **`FixedWindowStrategy`:** Counts requests in fixed wall-clock time windows.
2. **`TokenBucketStrategy`:** Handles bursty traffic using continuous token refills.
3. **`SlidingWindowStrategy`:** Prevents edge-of-window request bursts using sliding window timestamp logs.

### 2.3 Core RateLimiter Class

```typescript
export class RateLimiter {
  constructor(config: RateLimiterConfig)
  check(identifier: string): Promise<RateLimitResult>
}
```

#### `RateLimitResult` Interface

```typescript
export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
  remaining?: number
  total?: number
  limit?: number
  resetTime?: number
}
```

---

## 3. Dependencies

- `devDependencies`: `@repo/typescript-config`, `typescript`
