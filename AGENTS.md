# Repository Guidelines

Canonical policy for AI agents (Cursor, Claude Code, Codex, etc.) working in this monorepo. Keep this file lean; put detail in linked docs.

---

## Project Overview

**Arch-Systems** is a pnpm 9 monorepo (Node ≥ 22, Volta-pinned to 24.15.0) delivering a department-based operations portal for oil & gas field teams.

| Layer | Stack |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind |
| Data | Supabase (Postgres + RLS), Kysely types, self-hosted Docker stack |
| Cache | Redis L1 (RAM) + L2 (cluster), Next.js cache tags |
| UI | `@repo/theme` tokens, `@repo/ui` glass components, department modules |
| Build | Turborepo, conventional commits (commitlint + husky) |

**Single app:** `apps/portal` — all product work lands here or in shared `packages/*`.

**Two-layer policy:** Product code lives in `apps/` and `packages/`. Agent infrastructure (`.cursor/`, `.agents/`, `.claude/`, etc.) must never become a runtime dependency of product code.

---

## Architecture & Data Flow

### Request path

```text
Browser / Client Component
        │
        ▼
proxy.ts (Next.js 16 edge middleware — NOT middleware.ts)
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

### Key architectural rules

- **Auth at the edge:** `apps/portal/src/proxy.ts` gates every request. Never duplicate ACL logic inline — import from `@repo/acl`.
- **Department routes:** `app/(departments)/[department]/` — slugs defined in `@repo/acl` (`drilling`, `production`, `access-control`, `engineering`, `control-room`, `safety`, `training`, `satellite-monitoring`, etc.).
- **Backend proxy:** `/api/backend/*` → `API_BASE_URL` (default `http://localhost:3004/api`).
- **Caching pattern:** Validate auth in an un-cached outer function; fetch data in an inner cached function with `createAdminClient()` + `cacheTag`. Never read `cookies()`/`headers()` inside `"use cache"` scopes.
- **Supabase local-first:** Self-hosted Docker stack via `pnpm supabase:start`. Migrations in `packages/supabase/migrations/`. Never depend on remote cloud project links.

### Data access layers

| Package | Role |
| --- | --- |
| `@repo/supabase` | Auth clients (`server`, `client`, `middleware`, `service-role`, `read-replica`) |
| `@repo/database` | Kysely DB access layer |
| `@repo/contract` | Zod validation schemas + OpenAPI contracts |
| `@repo/redis` | L1/L2 cache singleton (`cacheGet`, `cacheSet`, `cacheDelete`) |
| `@repo/acl` | Department slugs, role definitions, restricted-route map |

---

## Key Directories

```text
apps/portal/                 # Next.js 16 portal (only app)
  src/app/                   # App Router: (auth), (departments), api/
  src/features/              # Domain modules: auth, hub, monitoring, departments, …
  src/components/            # Portal-specific UI (ArchStartMenu, CommandBar, …)
  src/lib/                   # Business logic, API helpers, department-cache
  src/proxy.ts               # Edge auth + ACL middleware
  e2e/                       # Playwright visual regression tests

packages/
  acl/                       # Department slugs + role definitions (SSOT)
  contract/                  # Zod schemas + OpenAPI
  database/                  # Kysely types
  departments/ui/            # Shared department UI subpackage
  errors/                    # Typed AppError subclasses
  logger/                    # Structured logging
  rate-limiter/              # Token bucket / sliding window
  redis/                     # Redis client + L1/L2 cache
  supabase/                  # Supabase client, migrations, seed
  theme/                     # Design tokens + Tailwind (Style Dictionary)
  typescript-config/         # Shared tsconfig presets
  ui/                        # Shared React components (GlassCard, Button, …)
  utils/                     # Shared utilities

scripts/                     # Dev boot, smoke tests, deploy, watchdog
tools/                       # CI gates: audit-rls, agents-verify, design-ratchet, theme-shape
docs/
  design-system/             # RULES.md, SPEC.md, DESIGN.md (enforceable visual contract)
  architecture/              # ADRs, scalability reference
  codebase-maps/             # Routes, data flow, package dependency maps
  runbooks/                  # Operational playbooks (Redis down, cache eviction, …)
  compliance/                # Compliance architecture
  WAYFINDER.md               # Concept → entry point → ADR index
  REPO-CHANGE-INDEX.md       # Append-only change log (agents must update)
```

Workspace globs: `apps/*`, `packages/*`, `packages/departments/*` (see `pnpm-workspace.yaml`).

---

## Development Commands

### Boot & dev

```bash
pnpm dev                          # Full stack: Redis → Supabase → portal (scripts/dev.sh)
pnpm dev:quick                    # Skip Redis, start Supabase + portal
pnpm dev:no-infra                 # Assume Redis + Supabase already running
pnpm shutdown                     # Stop all dev processes
```

`scripts/dev.sh` boot order: Redis → Supabase → Next.js portal → smoke test → monitoring terminals → open `/login`.

Flags: `--quality` (run quality gate after smoke), `--no-browser`, `--no-monitors`.

### Quality gate (mandatory before declaring done)

```bash
# CRITICAL: turbo caches lint — non-forced runs can return stale PASS
pnpm exec turbo run lint type-check test --force   # MUST show "0 cached"
pnpm --filter @repo/theme lint:tokens
pnpm format:check
```

### Full CI gate suite

```bash
pnpm gates    # agents:verify + design:ratchet + theme:shape + lint:tokens
pnpm quality  # turbo lint + type-check + test, then format:check
```

### Individual checks

```bash
pnpm --filter portal lint
pnpm --filter portal type-check
pnpm --filter portal test
pnpm --filter portal test -- path/to/file.test.tsx   # single test file
pnpm audit:rls                                       # RLS policy audit
pnpm audit:knip                                      # dead code / unused deps
pnpm db:codegen                                      # regenerate db-types.ts
pnpm analyze                                         # run @next/bundle-analyzer on client/server bundles
pnpm build                                           # turbo build all
pnpm format                                          # prettier --write
```

### Supabase & DB

```bash
pnpm supabase:start    # start local Docker stack (workdir: packages/)
pnpm supabase:status
pnpm supabase:stop
pnpx supabase migration new <name>   # new migration (from repo root)
```

### Deploy & ops scripts

```bash
bash scripts/smoke-test.sh                    # route + health smoke (dev or prod)
bash scripts/production-test-suite.sh         # full stack E2E against live instance
bash scripts/production-test-suite.sh --url https://portal.example.com --strict
bash scripts/portal-watchdog.sh start         # auto-restart dev server on crash
bash scripts/open-monitoring-terminals.sh       # ops monitoring terminals
bash deploy-production.sh                       # production deployment
pnpm deploy:live                                # live deployment wrapper
```

---

## Code Conventions & Common Patterns

### Git & commits

- **Conventional commits** enforced by commitlint + husky pre-commit (`lint-staged`: Prettier → ESLint on staged `.ts/.tsx/.js/.jsx`).
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Subject must not be start-case, pascal-case, or upper-case.
- **packageManager** pinned in root `package.json` — use corepack or declared pnpm 9.15.9.

### Feature organization

- **Thin routes, fat features:** App Router pages in `src/app/` delegate to `src/features/<domain>/`.
- **Shared UI:** Reuse `@repo/ui` primitives; portal-specific overlays stay in `src/components/`.
- **Validation:** Define Zod schemas in `@repo/contract`; share across server actions and API routes.
- **Errors:** Throw typed subclasses from `@repo/errors` (`AppError`, `NotFoundError`, etc.). Re-export via `apps/portal/src/lib/errors/error-classes.ts`.

### Design system (global rule)

Every change touching visual surfaces in `apps/`, `packages/ui/`, or `packages/theme/` **must**:

1. Follow [`docs/design-system/RULES.md`](./docs/design-system/RULES.md) — enforceable must/must-not list.
2. Apply tokens from [`docs/design-system/SPEC.md`](./docs/design-system/SPEC.md).
3. Read [`docs/design-system/DESIGN.md`](./docs/design-system/DESIGN.md) for intent before changing visuals.

When changing tokens or classes, update docs in the same commit:
- Token value added/removed → update **SPEC.md**.
- Structural decision → ADR in [`packages/theme/DECISIONS.md`](./packages/theme/DECISIONS.md) + **DESIGN.md**.

Do **not** run `generate-tokens.mjs` for CSS edits — edit `packages/theme/src/css/variables.css` directly. Guarded by `tools/theme-shape-guard.mjs`.

### Documentation (global rule)

- **Before** changing a domain, read its docs via [`docs/WAYFINDER.md`](./docs/WAYFINDER.md).
- **In the same change** that alters behavior, update every doc describing the old behavior.
- **Append** one row to [`docs/REPO-CHANGE-INDEX.md`](./docs/REPO-CHANGE-INDEX.md) before declaring done:

| Date | Agent | Area | Summary | Files | Docs updated |
| --- | --- | --- | --- | --- | --- |

- Remove stale scratch markdown; never leave abandoned docs behind.

### Agent tracing

Leave `// AGENT-TRACE:` breadcrumbs in code at non-obvious integration points. Update `.agents/AGENT_TRACER.md` for significant tasks.

### Working Across Package Boundaries

When work spans multiple packages, follow this incremental approach:

1. **Start with foundation packages** (no dependencies):
   - `packages/acl` - Department slugs and roles
   - `packages/contract` - Zod schemas
   - `packages/typescript-config` - Shared TS config

2. **Move to data layer packages**:
   - `packages/supabase` - Database clients and migrations
   - `packages/database` - Kysely types
   - `packages/redis` - Caching layer

3. **Update shared utilities**:
   - `packages/ui` - Shared components
   - `packages/utils` - Utility functions
   - `packages/errors` - Error classes

4. **Finally update consuming app**:
   - `apps/portal` - Portal application

**After each package change:**
```bash
# Test the specific package
pnpm --filter <package> type-check
pnpm --filter <package> test

# Check dependent packages
pnpm exec turbo run type-check --filter ...^<package>
```

### Build Dependency Order

Packages must be built in dependency order. The correct sequence:

1. Foundation: `@repo/typescript-config`, `@repo/eslint-config`
2. Types & Contracts: `@repo/acl`, `@repo/contract`, `@repo/errors`
3. Data Layer: `@repo/supabase`, `@repo/database`, `@repo/redis`
4. Utilities: `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`
5. UI Foundation: `@repo/theme`, `@repo/ui`
6. App: `apps/portal`

**Before testing a package, ensure its dependencies are built:**
```bash
# Example: Before testing portal
pnpm build --filter @repo/theme --filter @repo/ui --filter @repo/supabase
pnpm --filter portal test
```

### Monorepo Build & Deployment
- **Remote Caching:** Connect Turborepo to Vercel's remote cache (or S3) via `npx turbo link`. In CI, ensure `TURBO_TOKEN` and `TURBO_TEAM` are set to reuse build artifacts.
- **Turbo Prune:** For optimized Docker builds or slim deployments, use `turbo prune`:
  ```bash
  npx turbo prune --scope=portal --docker
  ```
  This generates a `out/` directory with a pruned workspace containing only the necessary packages.
- **Global Dependencies:** `turbo.json` tracks `.env*` and `AGENTS.md` as global dependencies. Any change to these files will invalidate the cache for all tasks.
- **Quality Pipeline:** Use `pnpm quality` (or `turbo run quality --filter=<pkg>`) for a comprehensive check before completion.

### Package-Level Guidelines

Critical shared packages have their own AGENTS.md files:
- [`packages/acl/AGENTS.md`](./packages/acl/AGENTS.md) - Department slugs and roles (SSOT)
- [`packages/contract/AGENTS.md`](./packages/contract/AGENTS.md) - Zod schemas and validation
- [`packages/ui/AGENTS.md`](./packages/ui/AGENTS.md) - Shared React components
- [`packages/supabase/AGENTS.md`](./packages/supabase/AGENTS.md) - Database clients and migrations
- [`packages/redis/AGENTS.md`](./packages/redis/AGENTS.md) - Caching layer

**Before changing a shared package:**
1. Read its package-level AGENTS.md
2. Identify all consuming packages
3. Plan incremental updates across the dependency chain
4. Update consumers after breaking changes

---

## Important Files

| File | Purpose |
| --- | --- |
| `apps/portal/src/proxy.ts` | Edge auth, ACL, redirect safety |
| `packages/acl/src/index.ts` | Department slugs + restricted roles (SSOT) |
| `packages/supabase/migrations/` | SQL migrations (source of truth) |
| `packages/supabase/src/db-types.ts` | Kysely-generated DB types (`pnpm db:codegen`) |
| `packages/theme/src/tokens/generated.ts` | Style Dictionary token output |
| `packages/theme/src/css/variables.css` | Hand-edited CSS custom properties |
| `packages/contract/index.ts` | Zod validation entry point |
| `packages/redis/src/cache.ts` | L1/L2 cache API |
| `turbo.json` | Turborepo pipeline + env passthrough |
| `pnpm-workspace.yaml` | Workspace package globs |
| `commitlint.config.mjs` | Conventional commit rules |
| `tools/agents-verify.mjs` | AGENTS.md link sync gate |
| `tools/design-ratchet.mjs` | Glass pattern enforcement ratchet |
| `tools/theme-shape-guard.mjs` | Token shape guard |
| `tools/audit-rls.cjs` | RLS policy audit |
| `docs/WAYFINDER.md` | Concept → entry point → ADR map |
| `docs/REPO-CHANGE-INDEX.md` | Append-only repo change log |

---

## Runtime/Tooling Preferences

| Setting | Value |
| --- | --- |
| Node | ≥ 22 (Volta: 24.15.0) |
| pnpm | 9.15.9 (pinned via `packageManager`) |
| Package manager | pnpm workspaces + Turborepo |
| `.npmrc` | `shamefully-hoist=true`, `strict-peer-dependencies=false` |
| Dev server | Next.js 16 Turbopack on `0.0.0.0:3000` |
| Supabase | Self-hosted Docker (`pnpm supabase:start`, workdir `packages/`) |
| Redis | Required for auth cache + L2; started by `dev.sh` |
| Lint cache | Turbo caches `lint` — always `--force` before claiming done |
| Prettier | Root formatter; runs in pre-commit via lint-staged |

### CI gate tools (root `package.json`)

| Script | Tool | Purpose |
| --- | --- | --- |
| `audit:rls` | `tools/audit-rls.cjs` | Verify RLS policies on migrations |
| `agents:verify` | `tools/agents-verify.mjs` | AGENTS.md link sync |
| `design:ratchet` | `tools/design-ratchet.mjs` | Glass/transparency pattern ratchet |
| `theme:shape` | `tools/theme-shape-guard.mjs` | `generated.ts` shape guard |
| `lint:tokens` | `@repo/theme lint:tokens` | Token integrity check |
| `gates` | All of the above | Full CI gate suite |

---

## Testing & QA

### Unit tests (Jest)

- **Portal:** `apps/portal/jest.config.cjs` — jsdom, `@swc/jest`, `@testing-library/react`.
- **Packages:** Jest in `packages/contract`, `packages/errors`, `packages/redis`, `packages/rate-limiter`, `packages/utils`, `packages/supabase`.
- Run: `pnpm --filter portal test` or `pnpm --filter <package> test`.
- Single file: `pnpm --filter portal test -- src/path/to/file.test.tsx`.

**Coverage thresholds** (portal, enforced in `jest.config.cjs`):

| Metric | Minimum |
| --- | --- |
| Lines | 40% |
| Branches | 30% |
| Functions | 35% |
| Statements | 40% |

### E2E / visual regression (Playwright)

- Config: `apps/portal/e2e/playwright.config.ts`.
- Tests: `*.visual.test.ts` in `apps/portal/e2e/`.
- **Requires dev server running** (`pnpm dev`) — Playwright does not start webServer.
- Base URL: `PLAYWRIGHT_BASE_URL` or `http://localhost:3000`.

### Smoke & production suites

| Script | Scope |
| --- | --- |
| `scripts/smoke-test.sh` | Critical routes, health endpoints, infra deps |
| `scripts/production-test-suite.sh` | Full stack: Portal → Redis → IndexedDB/SW → Supabase |
| `scripts/portal-watchdog.sh` | Dev server crash recovery with cache clear |

Smoke flags: `--port`, `--strict` (fail on warnings), `--json`.
Production flags: `--url`, `--verbose`, `--strict`, `--json`.

### Pre-merge checklist

```bash
pnpm exec turbo run lint type-check test --force
pnpm gates
pnpm format:check
# Optional: bash scripts/smoke-test.sh --strict
```

Do not trust a non-forced `pnpm quality` — cached lint can mask failures.

---

## Portal Agent

The primary AI agent for this repository is the **portal agent**, which operates on the `apps/portal` Next.js application. See [`apps/portal/CLAUDE.md`](./apps/portal/CLAUDE.md) for portal-specific guidance, commands, and architecture details.

## Auto-Connected Agent Tools (`cocoindex-code`)

All AI agents onboarding or coding in this codebase auto-connect to `cocoindex-code` for AST-based semantic and structural code search:
- Workspace MCP settings (`.mcp.json`, `.claude/mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `.kilo/kilo.jsonc`) are committed and auto-loaded by onboarding agents.
- Agents can run `ccc grep` for zero-index AST structural search or `ccc search` / `ccc mcp` for semantic code search.

## Further reading

- Portal app details: [`apps/portal/CLAUDE.md`](./apps/portal/CLAUDE.md)
- Agent knowledge base: `.agents/knowledge/index.md`
- Runbooks: [`docs/runbooks/`](./docs/runbooks/)
- Theme mechanics: [`packages/theme/README.md`](./packages/theme/README.md)

