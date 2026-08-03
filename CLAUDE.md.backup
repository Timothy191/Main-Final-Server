# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical policy

[`AGENTS.md`](./AGENTS.md) is the source of truth for all agents. It establishes the **design-system global rule** and points to authoritative docs per domain. Two-layer policy:

- **Product layer** (`apps/`, `packages/`) — the monorepo business portal. All real work happens here.
- **Agentic layer** (`.cursor/`, `.agents/`, `.claude/`) — agent infra only. Product code must not depend on it; never commit agent runtime state.

The portal app has its own [`apps/portal/CLAUDE.md`](./apps/portal/CLAUDE.md) with portal-specific rules — read it before working in `apps/portal`.

## Stack

pnpm 9.15.9 monorepo (workspace: `apps/*`, `packages/*`, `packages/departments/*`). Node ≥ 22 (Volta pins 24.15.0). Next.js 16 + React 19 + TypeScript + Tailwind. Supabase (Postgres) + Redis for runtime infra. Quality tasks run through Turbo (`turbo.json`).

> **Next.js 16 is not the version in your training data.** Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` — APIs, conventions, and file structure have breaking changes.

## Common commands

```bash
pnpm dev                # Full stack: Redis → Supabase → portal → smoke → browser (port 3000)
pnpm dev --quick        # Portal + Supabase only (skip Redis)
pnpm dev --no-infra     # Assume Redis + Supabase already running
pnpm quality            # lint + type-check + test + format:check (turbo-cached — see warning below)
pnpm build              # Turbo build everything
pnpm test               # Unit tests (turbo)
pnpm test:e2e           # Playwright E2E (requires `pnpm dev` running)
pnpm format             # Prettier write
pnpm supabase:start     # Local Supabase stack via Docker (workdir packages/)
```

**Run a single test** (portal): `pnpm --filter portal test -- --testPathPattern=proxy` or `pnpm --filter portal test -- proxy.test.ts`.

### Quality verification — mandatory before "done"

`turbo lint` is **cached and can return a stale PASS.** Do not trust a non-forced `pnpm quality`. Always verify with cache cold:

```bash
pnpm exec turbo run lint type-check test --force   # MUST show "0 cached"
pnpm format:check
pnpm agents:verify                                  # AGENTS.md link sync (runs in CI)
pnpm design:ratchet                                 # R2 ad-hoc-glass ratchet (standalone, no stale PASS)
pnpm theme:shape                                    # generated.ts presence guard (catches token-gen shrink)
# or all three standalone gates at once:
pnpm gates
```

## Design system — a global rule (not a suggestion)

Every visual surface (glass/transparency, panels, cards, ambient background) follows **one schema**. Before styling any panel/card:

1. Follow [`docs/design-system/RULES.md`](./docs/design-system/RULES.md) — no ad-hoc `backdrop-blur-*` or `bg-white/` opacity fills on panels/cards; use `.os-shell*` (chrome) or `GlassCard` / `.glass-card` (cards), both backed by `--arch-glass-*` tokens.
2. Apply exact tokens/classes from [`docs/design-system/SPEC.md`](./docs/design-system/SPEC.md).
3. Read [`docs/design-system/DESIGN.md`](./docs/design-system/DESIGN.md) for intent before changing anything visual.

When you change a token/class/visual contract, update the docs **in the same change**: value changes → SPEC.md; structural changes → add an ADR in [`packages/theme/DECISIONS.md`](./packages/theme/DECISIONS.md) and update DESIGN.md. Leaving these stale is a rule violation.

## Architecture

### Monorepo layout

- `apps/portal` — Next.js 16 operations dashboard (the main app). Route groups under `app/`: `(auth)`, `(hub)`, `(departments)`, `admin/`, `api/`. Domain logic in `features/`, shared utilities in `lib/`.
- `apps/portal/src/proxy.ts` — **central session/role/department/route-restriction logic** (successor to `middleware.ts`). The `employees` table is the source of truth for roles and department access. Server Components should use `getUserSafely()` from `@repo/supabase/server`.
- `apps/portal/src/app/api/backend/[[...slug]]` — proxies all HTTP methods to a backend API so the browser talks to a single origin.
- `@repo/acl` — **single source of truth for the ACL**: department route slugs, restricted route→role map, `Role` type, and the pure route-permission predicates. Imported by **both** `proxy.ts` (edge) and `lib/dept-access.ts` (node) so the two runtimes cannot drift (the former inline copies had already diverged). Edge-safe — pure data + functions, no Node APIs. `assertDeptRole` stays in `dept-access.ts` because it needs a server Supabase client.
- `packages/supabase` — data access layer (server/client/middleware/service-role/read-replica entry points). Kysely + typed DB.
- `packages/database` — **SQL migrations source of truth** (Kysely query-builder + types). Migrations live in `packages/supabase/migrations/` — create with `pnpx supabase migration new <name>` and push.
- `packages/theme` — design tokens (Style Dictionary) + Tailwind preset. Exports `./tokens`, `./css`, `./tailwind`, `./react`, `./motion`.
- `packages/ui` — shadcn-style primitives. `packages/departments/ui` — department-scoped UI.
- `@repo/errors` — canonical typed `AppError` classes with a fixed `ErrorCode` union; preserve the existing constructor contract when extending.
- `@repo/contract` — Zod validation schemas/contracts shared across the stack.
- `@repo/redis` — caching + rate limiting (`./cache`, `./client`). `@repo/logger`, `@repo/utils`, `@repo/eslint-config`, `@repo/typescript-config` — shared support.

### Key conventions

- **Errors:** use `@repo/errors` `AppError` with typed `code`/`status`; don't throw plain `Error` in product layer.
- **Caching:** `@repo/redis/cache` exposes `cacheGet`/`cacheSet`/`cacheEvictL1ByPrefix` (L1 + Redis). The portal's `lib/department-cache.ts` and `lib/dept-access.ts` layer on top.
- **RLS:** Supabase Row Level Security is enforced — run `pnpm audit:rls` and test policies in local Studio before pushing.
- **Env vars:** Turbo's `globalEnv` (in `turbo.json`) gates cache invalidation. Add new env vars there or cache won't bust. See `.env*` files for templates.

## Agent tracing (mandatory when modifying portal code)

1. Update `apps/portal/AGENT_TRACER.md` with a dated entry: agent, purpose, changes, notes for next agent.
2. Leave `// AGENT-TRACE: <explanation>` breadcrumbs for complex/non-obvious logic.

Skipping this breaks context hand-off for future agents.

## Docs to consult

- [`docs/`](./docs/) — `codebase-maps/` (API routes, client/server boundaries, data flow, package deps), `runbooks/` (Redis/circuit-breaker alerts), `architecture/`, `deployment/`, `optimization/` (Next.js 16 + TS monorepo perf).
- [`packages/theme/README.md`](./packages/theme/README.md) — token generation & validation mechanics.

## Doc maintenance + change index (global rule)

All agents must **use and update the docs** for any area they touch, and append a row to [`docs/REPO-CHANGE-INDEX.md`](./docs/REPO-CHANGE-INDEX.md) for every change. The structural index is [`docs/WAYFINDER.md`](./docs/WAYFINDER.md) (concept → entry point → ADR/trace → how-to-extend). See `AGENTS.md` → "Documentation" and "Repo change index" sections. Leaving docs stale is a rule violation.

## Gotchas

- **Turbo lint cache masking** — `turbo lint` caches a stale PASS; the root `.eslintignore` does not apply to the portal. Verify quality with `--force` and confirm `0 cached`. The standalone gates (`pnpm gates`) are not turbo-cached precisely to sidestep this.
- **Theme `generated.ts` drift** — do **not** run `generate-tokens.mjs` for CSS-value edits; it regenerates `generated.ts` (drops `arch0-15` tokens) and breaks `GlassCard`/`ui-primitives` tests. Edit CSS directly. Guarded by `pnpm theme:shape` (fails if the committed file loses its baseline shape).
- **Design-system R2 enforcement** — ad-hoc `bg-white/` / `backdrop-blur-*` on panels/cards is now ratchet-gated (`pnpm design:ratchet`); R4 transient surfaces (menus, modals, scrims) are filename-exempt. Lower the baseline with `--update` after intentional fixes.
- **ACL single source of truth** — never redefine department slugs or restricted roles inline in `proxy.ts` or `dept-access.ts`; add them to `@repo/acl` so both runtimes pick them up.
- **`agents:verify`** runs in CI and checks AGENTS.md link sync; AGENTS.md also references a `@repo/theme lint:tokens` task that may not exist — verify before citing it.