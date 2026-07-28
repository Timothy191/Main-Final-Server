# Packages & Dependencies Map

## Shared Package Ecosystem (`@repo/*`)

```text
                              +--------------------+
                              |  @repo/contract    |
                              |  (Zod Schemas)     |
                              +---------+----------+
                                        |
           +----------------------------+----------------------------+
           |                            |                            |
           v                            v                            v
+--------------------+       +--------------------+       +--------------------+
|  @repo/supabase    |       |    @repo/redis     |       |    @repo/errors    |
| (Auth / PostgREST) |       | (L1/L2 Cache, v2)  |       | (AppError Classes) |
+--------------------+       +--------------------+       +--------------------+
           |                            |                            |
           +----------------------------+----------------------------+
                                        |
                                        v
                              +--------------------+
                              |     @repo/ui       |
                              | (Shared UI System) |
                              +--------------------+
```

---

## Package Definitions & Exports

| Package                  | Key Exports                                                | Primary Responsibilities                                |
| :----------------------- | :--------------------------------------------------------- | :------------------------------------------------------ |
| **`@repo/contract`**     | Zod Schemas (`updateWebhookSchema`, etc.)                  | Request & response payload validation schemas           |
| **`@repo/database`**     | Kysely DB Client, Migration Runner                         | Direct SQL query builder and schema migrations          |
| **`@repo/errors`**       | `AppError`, `NotFoundError`, `InternalError`, `isAppError` | Typed application error classes and JSON serialization  |
| **`@repo/logger`**       | `serverLogger`, `clientLogger`                             | Structured JSON logging for server and browser contexts |
| **`@repo/rate-limiter`** | `TokenBucket`, `SlidingWindow`                             | API rate limiting primitives                            |
| **`@repo/redis`**        | `Cache` class, `cache` singleton, `cacheWrap`, `cacheGet`  | L1 (Memory) + L2 (Redis) caching library                |
| **`@repo/supabase`**     | `createServerSupabaseClient`, `createAdminClient`          | Supabase auth, DB client creation, and RLS helpers      |
| **`@repo/theme`**        | Tailwind CSS theme tokens, colors                          | System design tokens and semi-transparent white palette |
| **`@repo/ui`**           | `GlassCard`, `Button`, primitive components                | Shared reusable UI component library                    |
