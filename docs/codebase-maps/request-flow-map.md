# Request Flow Map

How a browser request travels through the portal. Source of truth:
`apps/portal/src/proxy.ts` + `docs/architecture/enterprise-resiliency-blueprint.md`.

```mermaid
flowchart TD
    Browser["Browser / Client Component"]
    Proxy["proxy.ts (Next.js 16 edge middleware)"]
    Refresh["Session refresh via @repo/supabase"]
    ACL["Department ACL from @repo/acl (SSOT)"]
    Redirect["Redirect safety + restricted-route checks"]

    API["API Route Handlers (/api/auth, /api/health, /api/backend/*)"]
    SCA["Server Components / Server Actions (actions.ts)"]
    Cache["@repo/redis (L1 RAM 15s + L2 Redis)"]
    DB["@repo/supabase → PostgreSQL + RLS"]

    Browser --> Proxy
    Proxy --> Refresh
    Proxy --> ACL
    Proxy --> Redirect
    Redirect -->|authenticated + authorized| API
    Redirect -->|authenticated + authorized| SCA
    API --> Cache
    SCA --> Cache
    Cache -->|miss| DB
    API -->|backend passthrough| DB
```

## Invariants

- **Un-cached auth, cached data:** validate auth in an un-cached outer
  function; fetch inside an inner cached function (`createAdminClient()` +
  `cacheTag`). Never read `cookies()`/`headers()` inside `"use cache"` scopes.
- **Backend proxy:** `/api/backend/*` forwards to `API_BASE_URL` (default
  `http://localhost:3004/api`).
- **Double-caching avoidance:** if Redis is the primary store, bypass the
  Next.js data cache with `cache: 'no-store'` or `connection()`.
