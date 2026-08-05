# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

**Arch-Systems** is a pnpm 9 monorepo (Node ≥ 22, Volta-pinned to 24.15.0) delivering a department-based operations portal for oil & gas field teams. The single application is `apps/portal` — a Next.js 16 (App Router, Turbopack) portal with React 19, TypeScript, Tailwind, Supabase (Postgres + RLS), and Redis (L1/L2 caching).

## Build & Development Commands

```bash
pnpm dev                          # Full stack: Redis → Supabase → portal
pnpm dev:quick                    # Skip Redis, start Supabase + portal
pnpm dev:no-infra                 # Assume Redis + Supabase already running
pnpm shutdown                     # Stop all dev processes

pnpm build                        # Turbo build all packages
pnpm --filter portal build        # Build portal only

pnpm lint                         # Turbo lint all
pnpm --filter portal lint         # Lint portal only
pnpm --filter portal type-check   # Type-check portal only
pnpm --filter portal test         # Run portal tests (Jest + jsdom)
pnpm --filter portal test -- path/to/file.test.tsx  # Single test file

pnpm quality                      # lint + type-check + test + format:check
pnpm gates                        # agents:verify + design:ratchet + theme:shape + lint:tokens
pnpm format:check                 # Prettier check all

# CRITICAL: turbo caches lint — always use --force before claiming done
pnpm exec turbo run lint type-check test --force
```

## Architecture Overview

### Request Path

```
Browser → proxy.ts (edge middleware, NOT middleware.ts)
  ├── Session refresh via @repo/supabase
  ├── Department ACL from @repo/acl (single source of truth)
  └── Redirect safety + restricted-route checks
        │
        ├──────────────────────┐
        ▼                      ▼
API Route Handlers      Server Components / Actions
(/api/auth, /api/health)       │
        │                      ▼
        │              @repo/redis (L1 15s / L2 Redis)
        └──────────┬───────────┘
                   ▼
        @repo/supabase → PostgreSQL + RLS
```

### Key Architectural Rules

- **Auth at the edge:** `apps/portal/src/proxy.ts` gates every request. Never duplicate ACL logic inline — import from `@repo/acl`.
- **Department routes:** `app/(departments)/[department]/` — slugs defined in `@repo/acl`. Routes are gated by `proxy.ts` department checks; the logged-in employee's `accessible_departments` must include the `[department]` segment.
- **Backend proxy:** `/api/backend/*` → `API_BASE_URL` (default `http://localhost:3004/api`).
- **Caching pattern:** Validate auth in an un-cached outer function; fetch data in an inner cached function with `createAdminClient()` + `cacheTag`. Never read `cookies()`/`headers()` inside `"use cache"` scopes.
- **RSC by default:** Use React Server Components; only use `"use client"` on interactive leaf components. Server Actions live in `actions.ts` files under `src/app/`.
- **Data access:** Use `@repo/supabase` for database access (server-side). `@repo/database` (Kysely) is for type generation only — never import it in app code.

### Package Dependency Order

Build and test in this sequence:

1. Foundation: `@repo/typescript-config`, `@repo/eslint-config`
2. Types & Contracts: `@repo/acl`, `@repo/contract`, `@repo/errors`
3. Data Layer: `@repo/supabase`, `@repo/database`, `@repo/redis`
4. Utilities: `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`
5. UI Foundation: `@repo/theme`, `@repo/ui`
6. App: `apps/portal`

### Caching Strategy (L1/L2 Redis vs Next.js Data Cache)

- **Shared Data (Redis):** Use `@repo/redis` for data shared across apps, workers, or valid across deployments.
- **Request-Scoped (`cache()`):** Use React `cache()` to deduplicate DB/API calls within a single render.
- **Next.js Data Cache:** For portal-specific data, prefer Next.js fetch cache and `unstable_cache` for ISR/revalidation.
- **Double-caching avoidance:** If Redis is the primary store, bypass Next.js data cache with `cache: 'no-store'` or `connection()`.
- **Revalidation sync:** When using `@repo/redis`, pair any `revalidateTag` with a corresponding `cache.invalidateTags` call.

## Critical Quality Gates (Mandatory Before "Done")

```bash
pnpm exec turbo run lint type-check test --force   # MUST show 0 cached
pnpm format:check
pnpm gates    # agents:verify + design:ratchet + theme:shape + lint:tokens
```

## Code Conventions

- **Conventional commits** enforced by commitlint + husky pre-commit. Subject must not be start-case, pascal-case, or upper-case.
- **Thin routes, fat features:** App Router pages delegate to `src/features/<domain>/`.
- **Validation:** Define Zod schemas in `@repo/contract`; share across server actions and API routes.
- **Errors:** Throw typed subclasses from `@repo/errors`. Re-export via `apps/portal/src/lib/errors/error-classes.ts`.
- **Design tokens:** CSS changes go in `packages/theme/src/css/variables.css`, never in `generated.ts`. The `tools/theme-shape-guard.mjs` enforces this.
- **UI imports:** Favor deep imports from `@repo/ui` (e.g., `@repo/ui/GlassButton`) over barrel imports.
- **Agent tracing:** Leave `// AGENT-TRACE:` breadcrumbs at non-obvious integration points.
- **No agent infrastructure in runtime code:** `.cursor/`, `.agents/`, `.claude/`, etc. must never become a runtime dependency of product code.
- **Cached tokens:** Reusable tokens and cache patterns live in `.agents/knowledge/skills/agent-caching/`. Read `SKILL.md` before generating new cached tokens.

## Key Files Reference

| File | Purpose |
| --- | --- |
| `apps/portal/src/proxy.ts` | Edge auth, ACL, redirect safety |
| `packages/acl/src/index.ts` | Department slugs + restricted roles (SSOT) |
| `packages/supabase/migrations/` | SQL migrations (source of truth) |
| `packages/redis/src/cache.ts` | L1/L2 cache API |
| `packages/contract/index.ts` | Zod validation entry point |
| `apps/portal/e2e/` | Playwright visual regression tests |
| `docs/WAYFINDER.md` | Concept → entry point → ADR map |
| `docs/REPO-CHANGE-INDEX.md` | Append-only repo change log |
| `docs/design-system/RULES.md` | Enforceable visual contract must/must-not |
| `docs/design-system/SPEC.md` | Design token specifications |
| `docs/design-system/DESIGN.md` | Design intent |

## Before Changing a Domain

1. Read the domain's entry point via `docs/WAYFINDER.md`
2. Update every doc describing the old behavior in the same change
3. Append one row to `docs/REPO-CHANGE-INDEX.md` before declaring done
4. Remove stale scratch markdown; never leave abandoned docs behind

## Testing Patterns

- **Portal tests:** Jest 30 with `@swc/jest`, jsdom, `@testing-library/react`. Files are `*.test.ts(x)`.
- **Run single test:** `pnpm --filter portal test -- path/to/file.test.tsx`
- **Mock at boundaries:** Mock Supabase/Redis at the boundary, not the component.
- **E2E tests:** Playwright visual regression in `apps/portal/e2e/*.visual.test.ts`. Requires dev server running.
- **Coverage thresholds (portal):** Lines 40%, Branches 30%, Functions 35%, Statements 40%.
