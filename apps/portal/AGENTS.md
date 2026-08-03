<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.

<!-- END:nextjs-agent-rules -->

> **Canonical policy:** the monorepo root `AGENTS.md` is the source of truth. **Shared knowledge base:** `.agents/knowledge/` (repowiki) — read `index.md` before non-trivial work; write durable learnings per `.agents/knowledge/README.md`.

## Portal Agent Rules

### Auth Enforcement via `proxy.ts`

- The portal enforces auth in `apps/portal/proxy.ts`, **NOT** `middleware.ts` (Next.js 16 rename).
- `proxy.ts` runs on every request: session refresh via `@repo/supabase`, department-based access control, and redirects for unauthenticated users.
- Redis-cached employee role/department checks back the access decisions. Never bypass `proxy.ts` for route protection.

### RSC + Server Actions Patterns

- Default to React Server Components (RSC). Client components (`"use client"`) only when interactivity is required.
- Server Actions live in `app/actions.ts` and per-route `actions.ts` files. They run on the server and may call `@repo/supabase` directly.
- Keep data access in Server Actions / RSC, not in client components, to preserve the data-boundary rule (`@repo/supabase`, never `@repo/database`).

### Department Route Conventions

- Department routes live under `app/(departments)/[department]/`. Valid departments: `drilling`, `production`, `access-control`, `engineering`, `control-room`, `safety`, `training`, `satellite-monitoring`.
- Routes under `(departments)` are gated by `proxy.ts` department checks — the logged-in employee's `accessible_departments` must include the `[department]` segment.
- Backend calls are proxied through `/api/backend/*` → `API_BASE_URL` (default `http://localhost:3004/api`). See `app/api/backend/[[...slug]]/route.ts`.

### Portal Test Patterns

- **Jest 30** with `@swc/jest`. Portal test files are `*.test.ts(x)` (distinguish from API `*.spec.ts`).
- React 19 + Testing Library for component tests. Mock Supabase/Redis at the boundary, not the component.
- Run a single test: `pnpm --filter portal test -- path/to/file.test.tsx`.
- Verify with `pnpm type-check`, `pnpm lint`, and `pnpm test` before marking work done.
