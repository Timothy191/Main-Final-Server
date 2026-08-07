---
paths:
  - apps/portal/src/app/**
  - apps/portal/src/proxy.ts
  - apps/portal/src/features/**
---

# Next.js 16 Portal Rules

App Router + Turbopack rules for `apps/portal`. Version-matched docs are
bundled at `node_modules/next/dist/docs/` (or `apps/portal/node_modules/next/dist/docs/`)
— consult them before resolving App Router / React 19 / Cache Components
features.

- **Edge middleware is `src/proxy.ts`**, never `middleware.ts` —
  `tools/next-backend-guard.mjs` forbids `middleware.ts/js`.
- **RSC by default:** use Server Components; add `"use client"` only on
  interactive leaf components.
- **Server Actions live in `actions.ts` files** under `src/app/`.
- **Thin routes, fat features:** App Router pages delegate to
  `src/features/<domain>/`.
- **Backend proxy:** `/api/backend/*` → `API_BASE_URL` (default
  `http://localhost:3004/api`).
- **Caching pattern:** validate auth in an un-cached outer function; fetch
  data in an inner cached function using `createAdminClient()` + `cacheTag`.
  Never read `cookies()`/`headers()` inside `"use cache"` scopes.
- **Redis invalidation:** when using `@repo/redis`, pair any `revalidateTag`
  with a corresponding `cache.invalidateTags` call.
- **Data access:** use `@repo/supabase` clients server-side; never import
  `@repo/database` (Kysely types) in runtime code.
- **Department routes:** `app/(departments)/[department]/` — slugs come from
  `@repo/acl` (single source of truth); never redefine the ACL inline.
