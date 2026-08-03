---
title: Portal auth & routing
tags: [architecture, portal, auth, routing, proxy, supabase]
updated: 2026-07-21
source_agent: claude-code
status: active
---

# Portal auth & routing

Grounded in [`apps/portal/AGENTS.md`](../../../apps/portal/AGENTS.md) and
[`apps/portal/GEMINI.md`](../../../apps/portal/GEMINI.md).

## Auth enforcement via `proxy.ts`

- The portal enforces auth in `apps/portal/proxy.ts` — **not** `middleware.ts` (renamed
  in Next.js 16). Never bypass `proxy.ts` for route protection.
- `proxy.ts` runs on every request: session refresh via `@repo/supabase`, department
  access control, and redirects for unauthenticated users.
- Role/department checks are Redis-cached to back access decisions.
- In Server Components, use `getUserSafely()` from `@repo/supabase/server` to avoid
  crashes on stale sessions.
- The `employees` table is the source of truth for roles and `accessible_departments`.

## Logout

- Route handler at `/api/auth/logout` (POST and GET)
- POST: Returns JSON `{ success: true, redirectUrl: '/login' }`
- GET: Redirects to `/login`
- Uses `createServerSupabaseClient()` and calls `supabase.auth.signOut()`
- Errors return 500 with `InternalError` from `@repo/errors`

## Route groups

- `(auth)/` — login and password management.
- `(departments)/[department]/` — dynamic department dashboards, gated by `proxy.ts`. The
  employee's `accessible_departments` must include the `[department]` segment.
- `(hub)/` — central landing page and executive view.
- `api/` — API routes (AI, export, sync, tools).

Valid departments: `drilling`, `production`, `access-control`, `engineering`,
`control-room`, `safety`, `training`, `satellite-monitoring`.

## Server vs client boundary

- Default to React Server Components; use `"use client"` only when interactivity is
  required.
- Server Actions live in `app/actions.ts` and per-route `actions.ts`; they run on the
  server and may call `@repo/supabase` directly.
- Keep data access in Server Actions / RSC, not client components.

## Backend proxy

- Backend calls are proxied through `/api/backend/*` -> `API_BASE_URL`
  (default `http://localhost:3004/api`). See `app/api/backend/[[...slug]]/route.ts`.

## Path aliases

- `~/*` or `@/*` -> `apps/portal/*`.
- `@/app/*`, `@/features/*`, `@/components/*`, `@/lib/*`, `@/hooks/*` map to their
  respective subdirectories.

## Testing

- Jest 30 with `@swc/jest`; portal tests are `*.test.ts(x)` (API uses `*.spec.ts`).
- React 19 + Testing Library; mock Supabase/Redis at the boundary, not the component.
- Single test: `pnpm --filter portal test -- path/to/file.test.tsx`.
