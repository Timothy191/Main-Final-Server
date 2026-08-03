# Redis Caching — Code Patterns

## Basic Get/Set

```typescript
import { cacheGet, cacheSet } from "@repo/redis/cache";

const user = await cacheGet<{ id: string; name: string }>("user:123");

if (!user) {
  const dbUser = await db.fetchUser("123");
  await cacheSet("user:123", dbUser, 600);
}
```

## Request Coalescing (cacheWrap)

```typescript
import { cacheWrap } from "@repo/redis/cache";

const data = await cacheWrap("expensive:key", () => fetchExpensiveData(), 300);
```

## Invalidation

```typescript
import { cacheDel, cacheDelByPrefix } from "@repo/redis/cache";

await cacheDel("user:123");
await cacheDelByPrefix("dept:");
```

## Rules

- L1 memory TTL max ~30s; L2 Redis for longer TTLs
- Never cache auth/session tokens or per-user secrets in shared keys
- Invalidate on mutation — prefer prefix/tag invalidation over blind TTL
