<!-- BEGIN:nextjs-agent-rules -->

# Next.js 16 Bundled Documentation Pointer

This repository uses Next.js 16 (App Router + Turbopack).
Version-matched documentation is bundled directly in `node_modules/next/dist/docs/` (or `apps/portal/node_modules/next/dist/docs/` in sub-packages).
Before writing code or resolving App Router / React 19 / Cache Components features, consult `node_modules/next/dist/docs/`.

<!-- END:nextjs-agent-rules -->

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
- **Department routes:** `app/(departments)/[department]/` — slugs defined in `@repo/acl` (SSOT). Full set (mirrored in `proxy.ts` `isValidRedirect`): `drilling`, `production`, `access-control`, `engineering`, `control-room`, `safety`, `training`, `satellite-monitoring`, `environment`, `logistics-fleet`, `geology`. Non-department top-level routes: `/hub`, `/executive`, `/admin`, `/quickview`, `/offline`.
- **No BFF proxy:** there is **no** `/api/backend/*` rewrite — `API_BASE_URL` in `env.ts` is vestigial and `next.config.mjs` defines no rewrites. The portal exposes its own `/api/*` route handlers (`/api/auth`, `/api/health`, `/api/ai/*`, `/api/modbus-ingest`, `/api/telemetry`, `/api/control-room`, `/api/cache`, …) and reaches data directly through `@repo/supabase`. The `.api/` directory indexes all route groups (`routes.json`, `openapi.yaml`).
- **AI & observability:** `/api/ai/*` uses `@google/genai` (Gemini); provider strategy is selected via `AI_BACKEND_STRATEGY` env (`ollama | gemini | router`). Sentry (`@sentry/nextjs`) + Vercel OTel are wired via `instrumentation.ts`; Sentry config is active only when `CI=true` or `ENABLE_HEAVY_PLUGINS=true`.
- **Caching pattern:** Validate auth in an un-cached outer function; fetch data in an inner cached function with `createAdminClient()` + `cacheTag`. Never read `cookies()`/`headers()` inside `"use cache"` scopes.
- **Supabase local-first:** Self-hosted Docker stack via `pnpm supabase:start`. Migrations in `packages/supabase/migrations/`. Never depend on remote cloud project links.

### Data access layers

| Package | Role |
| --- | --- |
| `@repo/supabase` | Auth clients (`server`, `client`, `middleware`, `service-role`, `read-replica`) |
| `@repo/database` | Kysely DB access layer |
| `@repo/contract` | Zod validation schemas + OpenAPI contracts |
| `@repo/redis` | L1/L2 cache singleton (`cacheGet`, `cacheSet`, `cacheDelete`, `cacheWrap`, `cacheSetWithTags`) |
| `@repo/acl` | Department slugs, role definitions, restricted-route map |
| `@repo/scraper` | Standalone dev/ops web scraper (Crawlee + Gemini) — never imported by portal runtime |

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
  database/                  # Kysely types (type-gen only — never runtime)
  departments/ui/            # Shared department UI subpackage
  errors/                    # Typed AppError subclasses
  eslint-config/             # Shared ESLint presets
  jest-config/               # Shared Jest presets
  logger/                    # Structured logging
  rate-limiter/              # Token bucket / sliding window
  redis/                     # Redis client + L1/L2 cache
  scraper/                   # Standalone web scraper (Crawlee + Gemini) — dev tool, not portal runtime
  supabase/                  # Supabase client, migrations, seed
  theme/                     # Design tokens + Tailwind (Style Dictionary)
  typescript-config/         # Shared tsconfig presets
  ui/                        # Shared React components (GlassCard, Button, …)
  utils/                     # Shared utilities

arch-engine/                 # Rust dev-tooling: rust-utils (lib) + rust-wiki-builder (bin),
                             # compiles repowiki/LIVE_SYS_STATUS.md; ops-daemon/ops-babysitter.mjs
repowiki/                    # Generated live-system status wiki (Rust-compiled — do not hand-edit)
.api/                        # Agent-context API surface index (routes.json, openapi.yaml) — NOT runtime code
.context/                    # ONBOARD.md agent fast-start + llms.txt
ops/                         # Grafana / Prometheus / Alertmanager configs
devops/                      # nginx configs + deploy scripts

scripts/                     # Dev boot, smoke tests, deploy, watchdog
tools/                       # CI gates: audit-rls, agents-verify, design-ratchet, theme-shape
docs/
  design-system/             # RULES.md, SPEC.md, DESIGN.md (enforceable visual contract)
  architecture/              # ADRs, scalability reference
  codebase-maps/             # Mermaid maps (architecture, request flow, deps, caching, CI)
  runbooks/                  # Operational playbooks (Redis down, cache eviction, …)
  compliance/                # Compliance architecture
  onboarding/                # Agent onboarding material
  WAYFINDER.md               # Concept → entry point → ADR index
  REPO-CHANGE-INDEX.md       # Append-only change log (agents must update)
  ARCHITECTURE-MAP.md        # Monorepo visual overview (mermaid)
  HYBRID-CACHE-MAP.md        # In-process L1 heap + SQLite WAL cache design
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
pnpm gates    # 13-check suite: lint:markdown + lint:css + lint:yaml + audit:knip + check:drift +
              # agents:verify + design:ratchet + theme:shape + next-backend-guard +
              # performance-budget-guard + lint:tokens + guard:imports + guard:ignoresync
pnpm quality  # turbo lint + type-check + test (--concurrency=4) + format:check + lint:yaml +
              # audit:knip + check:drift + next-backend-guard
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
pnpm guard:imports                                   # client/server import boundary guard
pnpm guard:ignoresync                                # .gitignore ↔ .claudeignore sync guard
pnpm lint:markdown                                   # markdownlint on **/*.md
pnpm lint:css                                        # stylelint on theme + ui CSS
pnpm lint:yaml                                       # tools/lint-yaml.mjs
pnpm check:drift                                     # drift score from .agents/AGENT_TRACER.md
pnpm size:check                                      # size-limit budget
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
- **API route guards:** every `/api/*` handler runs `runApiGuards` from `apps/portal/src/lib/api/api-guard.ts` (rate limit, SSRF, CSRF, CORS, body limit). Extend it there, never per-route.

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

- **Tracer format:** sequential entries with Agent, ISO timestamp, Purpose, Changes, Dependencies, Notes — separated by `---`. `apps/portal/AGENT_TRACER.md` tracks portal-only work.
- **Drift score:** if the current work drifts from the task/plan, append a line like `DRIFT SCORE: 0.15` (0 = fully aligned). `pnpm check:drift` (part of `gates`/`quality`) fails when the latest score ≥ 0.1. No score line means "no drift" and passes.

### Non-obvious gotchas

- **Workflow map (`.github/workflows/`):** `portal-ci.yml` is the real CI for portal/packages (type-check + lint + test + `agents:verify`, plus build/analyze/smoke jobs). `ci-monorepo.yml` runs an affected-diff build (`turbo run build ... --filter=...[origin/main]`) on PRs. `context-check.yml` runs `.scripts/check_context.sh` (context-efficiency enforcement). `codeql.yml` and `deploy-production.yml` round out the set. **`ci.yml` is stale** — it triggers on a `redis/` module directory that no longer exists at the repo root.
- **Root `README.md` is stale** — it still describes Nx, `apps/cms`, `apps/overview`, and workflows that no longer exist. Trust `AGENTS.md` and `docs/WAYFINDER.md` over it.
- **pnpm catalog + release age:** `pnpm-workspace.yaml` pins shared dev-tool versions in a `catalog:` block and sets `minimumReleaseAge: 2880` (48 h) — freshly published dependency versions are ignored until 48 h old unless excluded (`@repo/*`, `next`, `react`, `react-dom`). A just-released version may silently resolve to an older one.
- **Portal build pipeline:** `pnpm --filter portal build` runs `build:cache-handler` (compiles `tsconfig.cache-handler.json` → `dist/lib/next-cache-handler.js`, wired as `cacheHandlers.default` in `next.config.mjs`) then `node scripts/generate-openapi-spec.js` then `next build`. Heavy plugins (Sentry upload, `output: standalone`) activate only when `CI=true` or `ENABLE_HEAVY_PLUGINS=true`. `next.config.mjs` sets `cacheComponents: true` with custom `cacheLife` profiles `1 minute` / `5 minutes` / `24 hours`.
- **`_appdata/` is a FUXA SCADA data directory** (`settings.js`, `*.fuxap.db`, uiPort 1881) used by local tooling. Treat as runtime data, not source; do not edit, index, or rely on it.
- **`benchmark.js` and `benchmark-cache.db`** at repo root are local benchmark artifacts, not part of the build.
- **Ignore files must stay in sync:** `guard:ignoresync` requires critical patterns (`.turbo`, `.cocoindex_code/`, etc.) to be present in both `.gitignore` and `.claudeignore`.
- **Client/server boundary:** components, hooks, `packages/ui`, and `packages/departments/ui` must never import `@repo/redis`, `@repo/database`, or `@repo/supabase/server` — `guard:imports` enforces this. Server components in `components/` without `"use client"` are skipped.
- **`@repo/database` (Kysely) is for type generation only** — never import it in app runtime code; use `@repo/supabase` clients.

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
| `agents:verify` | `tools/agents-verify.mjs` | AGENTS.md link sync (also runs in CI) |
| `design:ratchet` | `tools/design-ratchet.mjs` | Glass/transparency pattern ratchet |
| `theme:shape` | `tools/theme-shape-guard.mjs` | `generated.ts` shape guard |
| `lint:tokens` | `@repo/theme lint:tokens` | Token integrity check |
| `lint:markdown` | `markdownlint-cli` | Markdown lint (ignores `packages/rust-bindings/**`) |
| `lint:css` | `stylelint` | CSS lint on `packages/theme` + `packages/ui` |
| `lint:yaml` | `tools/lint-yaml.mjs` | YAML lint (CI configs, workflows) |
| `audit:knip` | `knip` | Dead code / unused dependency audit |
| `check:drift` | `tools/check-drift-score.mjs` | Fails if latest `DRIFT SCORE:` line in `.agents/AGENT_TRACER.md` ≥ 0.1 |
| `next-backend-guard` | `tools/next-backend-guard.mjs` | Forbids `middleware.ts/js`; enforces `proxy.ts` + backend proxy rules |
| `performance-budget-guard` | `tools/performance-budget-guard.mjs` | Audits server-action files for heavy client-bundle imports |
| `guard:imports` | `tools/import-boundary-guard.mjs` | Blocks client dirs from importing `@repo/redis`, `@repo/database`, `@repo/supabase/server` |
| `guard:ignoresync` | `tools/ignore-sync-guard.mjs` | Critical ignore patterns must exist in both `.gitignore` and `.claudeignore` |
| `gates` | All of the above | Full CI gate suite (13 checks) |

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

## Consolidating Agent Context & Rules (`.agents/` & `memory/`)

All agent skills, rules, and prompt profiles are consolidated in the central [`.agents/`](file:///home/timothy/Documents/Arch-System/.agents/) directory to prevent IDE index bloat:
- **Registry**: Rules are stored in [`.agents/rules/`](file:///home/timothy/Documents/Arch-System/.agents/rules/) and skills in [`.agents/skills/`](file:///home/timothy/Documents/Arch-System/.agents/skills/).
- **Dynamic Context Utility**: Active rules can be fetched/discarded dynamically to prevent editor memory issues:
  ```bash
  # List all available rules and skills in the registry
  .agents/scripts/manage-agent-context.sh list

  # Load specific rules/skills into your active IDE directories for the current task
  .agents/scripts/manage-agent-context.sh load server-actions design-system

  # Discard all active rules/skills from the system when the task is complete
  .agents/scripts/manage-agent-context.sh clean
  ```

- **Agent Memory Workspace (`memory/`)**:
  To ensure persistent context does not clash between different active agents, each agent must create and maintain its own dedicated subdirectory under `memory/` (e.g. `memory/<agent-name>-memory/`).
  Inside each agent memory workspace:
  *   Maintain a `short/` subdirectory for temporary task-state snapshots.
  *   Maintain a `long/` subdirectory for permanent project-level learnings.
  *   Individual memory entries must be stored as single, descriptive `.md` markdown files.
  *   A central `INDEX.md` file must reside in the root of the agent's subdirectory detailing the purpose of each memory log.


---

## Portal Agent

The primary AI agent for this repository is the **portal agent**, which operates on the `apps/portal` Next.js application. See [`apps/portal/CLAUDE.md`](./apps/portal/CLAUDE.md) for portal-specific guidance, commands, and architecture details.

## Advisor Agent

The **advisor agent** monitors all active agents working in this repository and injects real-world verified steering, advice, and recommendations. See [`.agents/rules/05-advisor.mdc`](./.agents/rules/05-advisor.mdc) (as well as `.claude/rules/advisor.md` and `.cursor/rules/advisor.mdc`) for the full steering guidelines.

## Auto-Connected Agent Tools (`cocoindex-code`, `codegraph`)

All AI agents onboarding or coding in this codebase auto-connect to workspace tools:

- **`cocoindex-code`**: Used for AST-based semantic and structural code search. Agents can run `ccc grep` for zero-index AST structural search or `ccc search` / `ccc mcp` for semantic code search.
- **`codegraph`**: Used for graph-based code understanding, running at `http://localhost:6010/mcp`.
- Workspace MCP settings (`.mcp.json`, `.claude/mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `.kilo/kilo.jsonc`) are committed and auto-loaded by onboarding agents.

## Further reading

- Agent fast-start: [`.context/ONBOARD.md`](./.context/ONBOARD.md)
- Portal app details: [`apps/portal/CLAUDE.md`](./apps/portal/CLAUDE.md) and [`apps/portal/AGENTS.md`](./apps/portal/AGENTS.md)
- Package catalog: [`packages/INDEX.md`](./packages/INDEX.md)
- Agent knowledge base: `.agents/knowledge/index.md`
- Runbooks: [`docs/runbooks/`](./docs/runbooks/)
- Theme mechanics: [`packages/theme/README.md`](./packages/theme/README.md)
- Visual maps: [`docs/ARCHITECTURE-MAP.md`](./docs/ARCHITECTURE-MAP.md), [`docs/HYBRID-CACHE-MAP.md`](./docs/HYBRID-CACHE-MAP.md), [`docs/codebase-maps/`](./docs/codebase-maps/)

---

## Proactive Best Practices & Completeness Enforcer

- **Auto-Correction & Completeness**: If performing implementation changes, always proactively include all related actions, files, imports, and features required by industry best practices and monorepo documentation, even if the user forgets to explicitly request them in the prompt.
  - *Example*: When renaming or refactoring a symbol, file, or package, automatically trace, update, and resolve all referencing imports, paths, and configurations across the entire workspace.
  - *Example*: When introducing new features, ensure they are fully compliant with existing design patterns, typing structures, and CI lint gates, proactively resolving any adjacent integration issues.

<!-- RUNQL:BEGIN -->
# RunQL Context

This workspace stores RunQL files locally under this project folder.

RunQL storage root:

./RunQL

Useful paths:

- Queries: ./RunQL/queries
- Query index: ./RunQL/system/queries/queryIndex.json (auto-updated when a query is saved)
- Schemas: ./RunQL/schemas
- Connection profiles: ./RunQL/system/connections.json
- Prompt templates: ./RunQL/system/prompts

## Required Workflow (SQL Queries)

1. Search for existing queries first — check the query index and `./RunQL/queries` (including subdirectories).
2. If nothing relevant exists, read the schema and docs under `./RunQL/schemas`. Use `./RunQL/schemas/<connection>/manifest.json` to find available schemas, then read only the relevant `./RunQL/schemas/<connection>/<schema>/schema.json` and `description.json`. Ignore `./RunQL/schemas/deleted/` and `*_deleted` folders unless the user asks for archived content.
3. Only then create a new SQL query file. Prefer to reuse or extend existing patterns. Put saved SQL under `./RunQL/queries/<connection>/`.

## Required Workflow (Documentation Requests)

1. **SQL query documentation:** follow `./RunQL/system/prompts/markdownDoc.txt`. Output goes in the same directory as the query with the same base name and a `.md` extension (e.g., `olympic_gold.sql` → `olympic_gold.md`).
2. **Schema description:** follow `./RunQL/system/prompts/describeSchema.txt`. Output goes to the matching bundle folder as `./RunQL/schemas/<connection>/<schema>/description.json`.
3. **Inline SQL comments:** follow `./RunQL/system/prompts/inlineComments.txt`.

Secrets are stored in VS Code SecretStorage and are not present in these files.
<!-- RUNQL:END -->
