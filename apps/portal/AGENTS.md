<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.

<!-- END:nextjs-agent-rules -->

> **Canonical policy:** the monorepo root [`AGENTS.md`](../../AGENTS.md) is the source of truth. **Shared knowledge base:** [`.agents/knowledge/`](../../.agents/knowledge/) — read [`index.md`](../../.agents/knowledge/index.md) before non-trivial work.

## Portal Agent Rules

### Auth Enforcement via `proxy.ts`

- The portal enforces auth in `apps/portal/src/proxy.ts`, **NOT** `middleware.ts` (Next.js 16 rename).
- `proxy.ts` runs on every request: session refresh via `@repo/supabase`, department-based access control from `@repo/acl`, and redirects for unauthenticated users.
- Redis-cached employee role/department checks back the access decisions. Never bypass `proxy.ts` for route protection.

### RSC + Server Actions Patterns

- Default to React Server Components (RSC). Client components (`"use client"`) only when interactivity is required.
- Server Actions live under `src/app/` (`actions.ts` and per-route `actions.ts`). They run on the server and may call `@repo/supabase` directly.
- Keep data access in Server Actions / RSC, not in client components, to preserve the data-boundary rule (`@repo/supabase`, never `@repo/database`).

### Department Route Conventions

- Department routes live under `src/app/(departments)/[department]/`. Valid slugs are defined in `@repo/acl` (`drilling`, `production`, `access-control`, `engineering`, `control-room`, `safety`, `training`, `satellite-monitoring`, etc.).
- Routes under `(departments)` are gated by `proxy.ts` department checks — the logged-in employee's `accessible_departments` must include the `[department]` segment.
- Backend calls are proxied through `/api/backend/*` → `API_BASE_URL` (default `http://localhost:3004/api`). See `src/app/api/backend/[[...slug]]/route.ts`.

### Portal Test Patterns

- **Jest 30** with `@swc/jest`. Portal test files are `*.test.ts(x)` (distinguish from API `*.spec.ts`).
- React 19 + Testing Library for component tests. Mock Supabase/Redis at the boundary, not the component.
- Run a single test: `pnpm --filter portal test -- path/to/file.test.tsx`.
- Verify before done: `pnpm exec turbo run lint type-check test --force` (must show **0 cached**), then `pnpm gates` and `pnpm format:check`.

## Performance Rules
- Always use `next/image` and `next/font`.
- Keep components server-side unless they need `useState`, `useEffect`, or event handlers.
- Wrap database queries with `cache()` from React when used in multiple components.
- After any mutation, call `revalidatePath` or `revalidateTag` to keep ISR fresh.
- Favor deep imports from `@repo/ui` (e.g., `@repo/ui/GlassButton`) over barrel imports.

## Caching Synergy (L1/L2 Redis vs Next.js Data Cache)
- **Shared Data (Redis):** Use `@repo/redis` for data that needs to be shared across multiple apps, worker processes, or remains valid across deployments.
- **Request-Scoped Data (`cache()`):** Use React `cache()` to deduplicate database or API calls within a single render cycle.
- **Next.js Data Cache:** For portal-specific data, prefer Next.js's built-in fetch cache and `unstable_cache` to leverage ISR and easy revalidation.
- **Double-Caching Avoidance:** If using Redis as the primary data store, bypass Next.js's data cache by setting `cache: 'no-store'` or using `connection()`.
- **Revalidation Mapping:** When using `@repo/redis`, ensure any `revalidateTag` call is paired with a corresponding `cache.invalidateTags` call to `@repo/redis`.
