# Caching Map

Redis L1 (RAM) + L2 (cluster) cache flow and invalidation. API:
`packages/redis/src/cache.ts` (`cacheGet`, `cacheSet`, `cacheDelete`).

```mermaid
flowchart TD
    Caller["Server Component / Action / Route"]
    Key["Cache key (namespaced, e.g. arch:auth:employee:<userId>)"]
    L1{"L1 RAM hit?"}
    L1Miss["Read L2 (Redis cluster)"]
    L2{"L2 hit?"}
    DB["@repo/supabase → PostgreSQL"]
    Store["Write-through: L1 + L2"]
    TTL["TTL: L1 15s / L2 longer"]

    Revalidate["revalidateTag / cache.invalidateTags"]
    Invalidate["/api/cache/invalidate { userId }"]
    Evict["cacheDelete (L1 + L2)"]

    Caller --> Key --> L1
    L1 -->|hit| Return["Return"]
    L1 -->|miss| L1Miss --> L2
    L2 -->|hit| Return
    L2 -->|miss| DB --> Store --> TTL --> Return

    Invalidate --> Revalidate
    Revalidate --> Evict --> L1
    Revalidate --> Evict --> L2
```

## Invariants

- **Never cache the auth check** — validate auth in an un-cached outer
  function; only the data fetch is cached.
- **Double-caching avoidance:** when Redis is the primary store, bypass the
  Next.js data cache (`cache: 'no-store'` or `connection()`).
- **Revalidation sync:** any `revalidateTag` must be paired with a
  `cache.invalidateTags` call.
- **Eviction trigger:** on employee role change, the admin `UsersTab`
  role-change flow evicts `arch:auth:employee:<userId>` via
  `POST /api/cache/invalidate`.
