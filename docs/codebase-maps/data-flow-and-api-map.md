# Data Flow & API Architecture Map

## Client-to-Server Request Flow

```text
[ Browser / Client Component ]
              │
              ▼
[ proxy.ts (Next.js 16 Proxy Middleware) ]
  ├── 1. Decodes & validates path redirect safety
  ├── 2. Evaluates RESTRICTED_ROUTES & Department ACL
  └── 3. Validates Supabase auth session cookies
              │
              ▼
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
[ Next.js API Route ]  [ Server Component / Server Action ]
  (/api/auth/logout,     (App Router Page)
   /api/health/*)              │
    │                          ▼
    │                  [ @repo/redis Cache (L1/L2) ]
    │                    ├── L1: Local RAM (15s TTL)
    │                    └── L2: Redis Cluster
    │                          │
    └──────────┬───────────────┘
               ▼
   [ @repo/supabase Client ]
     ├── createServerSupabaseClient() (User Session Context)
     └── createAdminClient() (Service Role / Cached Scope)
               │
               ▼
  [ Supabase PostgreSQL + RLS ]
```

---

## Key API Routes & Endpoints Map

| Endpoint            | Method        | Responsibility                  | Implementation                                                                                                                 |
| :------------------ | :------------ | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/logout`  | `POST`, `GET` | User sign-out & cookie deletion | [`apps/portal/src/app/api/auth/logout/route.ts`](file:///home/timothy/Projects/apps/portal/src/app/api/auth/logout/route.ts)   |
| `/api/health`       | `GET`         | Full stack health check         | [`apps/portal/src/app/api/health/route.ts`](file:///home/timothy/Projects/apps/portal/src/app/api/health/route.ts)             |
| `/api/health/live`  | `GET`         | Liveness probe (process up)     | [`apps/portal/src/app/api/health/live/route.ts`](file:///home/timothy/Projects/apps/portal/src/app/api/health/live/route.ts)   |
| `/api/health/ready` | `GET`         | Readiness probe (DB/Redis up)   | [`apps/portal/src/app/api/health/ready/route.ts`](file:///home/timothy/Projects/apps/portal/src/app/api/health/ready/route.ts) |
| `/api/metrics`      | `GET`         | Operational metrics payload     | [`apps/portal/src/app/api/metrics/route.ts`](file:///home/timothy/Projects/apps/portal/src/app/api/metrics/route.ts)           |

---

## Caching Data Flow Rules (Next.js 16)

- **"use cache" Directive Rule:** Never read `cookies()` or `headers()` inside a `"use cache"` scope.
- **Decoupled Auth Pattern:** Validate user authorization in an outer un-cached function, then call an inner cached data fetcher using `createAdminClient()` and `cacheTag`.
