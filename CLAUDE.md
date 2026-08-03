# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Arch Systems (Plantcor)** — Industrial mining-operations portal. pnpm + Turborepo monorepo with a Next.js 16 portal, ops-gateway, and shared `@repo/*` packages. Supabase for auth/DB, Redis for caching/rate-limiting, Inngest for background jobs, Sentry for error monitoring, OpenTelemetry for observability.

> **Canonical agent policy:** `AGENTS.md` (including §20 Alignment Score). Cursor rules in `.cursor/rules/` always apply. Do not drift.

**Two Layers:** Product (`Server/apps/`, `Server/packages/`, product scripts) must build/run/test without AI content. Agentic surfaces (`.cursor/`, `AGENTS.md`, `pnpm ai`) are CLI-agents only. Contract: [`.cursor/standards/layer-boundary/STANDARD.md`](.cursor/standards/layer-boundary/STANDARD.md).

**Reasoning contract:** `SOUL.md` — evidence-based decisions, test-driven delivery, adversarial review before committing.

**Shared knowledge base:** `.agents/knowledge/` (repowiki) — read `index.md` before non-trivial work; write durable, evidence-cited learnings there. Protocol: `.agents/knowledge/README.md`.

## Essential Commands

```bash
# Product (standalone, run from Server/ directory)
cd Server
pnpm dev              # Full stack: Redis → Supabase → Next.js (Turbopack HMR on :3000)
pnpm dev --quick      # Portal + DB (skip Redis, start Supabase)
pnpm dev --no-infra   # Assume Redis + Supabase already up
pnpm dev --quality    # Also run pnpm quality after smoke test
pnpm build            # Turborepo full build
pnpm lint             # ESLint across all packages (--max-warnings 0 enforced)
pnpm type-check       # tsc --noEmit across all packages
pnpm test             # Jest across all packages
pnpm quality          # lint + type-check + test + prettier check (run before marking done)
pnpm format           # Prettier write (product paths; agentic dirs ignored)
pnpm format:check     # Prettier check only
pnpm clean            # Remove .next and dist dirs
pnpm --filter portal <cmd>  # Run a command for just the portal app

# Supabase (local dev, run from Server/ directory)
pnpm supabase:start   # Start local Supabase (--workdir packages)
pnpm supabase:stop    # Stop local Supabase
pnpm supabase:status  # Check Supabase status

# RLS & policy
pnpm audit:rls        # Verify RLS after migration changes

# Agentic (optional, run from Server/ directory)
pnpm ai               # AI system health (guardrails, layouts, sync, dedupe, drift)
pnpm ai check         # Validate AI surfaces only
pnpm ai fix           # Safe repair + validate
pnpm ai init          # First clone / cold start — restore + sync + validate
pnpm ai onboard       # Onboarding checklist for humans + agents
```

## Architecture

### Monorepo Layout

```
Server/
  apps/
    portal/                 # Next.js 16 (App Router) — primary deployable UI
    ops-gateway/            # Control-plane / MCP ops bridge (not product UI)
  packages/
    contract/               # @repo/contract — shared Zod schemas
    database/               # @repo/database — SQL migrations source of truth
    departments/            # @repo/departments (+ ui/)
    errors/                 # @repo/errors — typed AppError classes
    eslint-config/          # @repo/eslint-config
    logger/                 # @repo/logger — structured logging
    rate-limiter/           # @repo/rate-limiter — Redis-backed
    redis/                  # @repo/redis — shared ioredis singleton
    supabase/               # @repo/supabase — server + browser clients
    theme/                  # @repo/theme — Tailwind preset & design tokens (+ ArchThemeProvider at @repo/theme/react)
    typescript-config/      # @repo/typescript-config
    ui/                     # @repo/ui — shared React components (styled: GlassCard, Toaster, Pagination, etc.)
    utils/                  # @repo/utils — pure utility helpers
  scripts/                  # dev.sh, shutdown.sh, ai.sh, agency-*, delegate-agent.sh
```
```

### Portal src/ Layout

```
apps/portal/src/
  app/          # App Router: (auth), hub, (departments), admin, api, docs
  components/   # Portal-specific React components
  config/       # Portal config
  features/     # Feature modules (access-control, admin, analytics, auth, departments, hub)
  hooks/        # Portal-specific hooks
  lib/          # Shared lib (ai, api, errors, jobs, observability, reports, …)
```

### Key Technology Choices

| Concern             | Choice                                                 |
| ------------------- | ------------------------------------------------------ |
| Framework           | Next.js 16 (App Router, Turbopack in dev)              |
| Language            | TypeScript 5.7 strict (no `any`, no `@ts-ignore`)      |
| Styling             | Tailwind CSS 3 via `@repo/theme` preset                |
| UI primitives       | `@repo/ui` (extend before reaching for Radix directly) |
| Client state        | Zustand 5 (global only)                                |
| Validation          | Zod 3 (all external input)                             |
| Auth / DB           | Supabase                                               |
| Caching / queues    | Redis via `@repo/redis`                                |
| Background jobs     | Inngest 4                                              |
| Observability       | OpenTelemetry + Sentry                                 |
| Error classes       | `@repo/errors` — AppError subclasses only              |
| Icons               | lucide-react only                                      |
| Toasts              | sonner only                                            |
| Package manager     | pnpm 9 (Never use npm or yarn)                         |
| Build orchestration | Turborepo 2                                            |
| Node                | >= 22 (Volta pin: 24)                                  |

## Spec-Driven Workflow (Mandatory)

Every non-trivial task follows a three-phase spec cycle. Spec files go in `.kiro/specs/<feature-slug>/`:

1. **Requirements** — numbered, testable acceptance criteria. Resolve ambiguities before proceeding.
2. **Design** — architecture, files changed, data flow, server/client boundaries, env vars, new packages. Get sign-off before coding.
3. **Tasks** — smallest independently-testable units, ordered to build on a passing baseline.

## Server vs Client Boundary

- **Server (default)**: Data fetching, DB access, secrets. Use `import "server-only"` for packages that must never reach the browser.
- **Client** (`"use client"`): Interactivity, browser APIs, hooks. Keep small — leaf nodes or thin wrappers.
- **Server Actions** (`"use server"`): Form mutations, data writes. Always validate with Zod, return `{ data } | { error }`, call `revalidatePath`/`revalidateTag` after mutations.
- Never import `@repo/supabase/server` or `@repo/redis` from a Client Component.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any non-`NEXT_PUBLIC_` secret to the client.
- Never put `"use client"` on layout files.
- Never `fetch()` your own Next.js API routes from Server Components — call the data function directly.

## Component Conventions

- Page-level: `<FeatureName>Page` (Server Component, default export)
- Client interactive: `<FeatureName>Form`, `<FeatureName>Modal`, `<FeatureName>Table`
- Server data: `get<Resource>`, `list<Resource>`, `find<Resource>`
- Server mutations: `create<Resource>Action`, `update<Resource>Action`, `delete<Resource>Action`
- Always define `interface <Component>Props` — no inline object types on function signatures.
- Every `page.tsx` must export `metadata` (at minimum `title` and `description`).
- Add `loading.tsx` alongside any page that performs async data fetching.
- Every route segment that can fail needs an `error.tsx` (`"use client"`).

## Testing

- Unit tests live next to the file: `foo.ts` → `foo.test.ts`
- Integration tests for Server Actions in `__tests__/actions/`
- Jest with SWC transform, jsdom environment
- Every new utility in `packages/` needs at least one test
- Every Server Action needs happy-path + validation-failure test
- Coverage targets: lines 40%, branches 30%, functions 35%
- Run a single test: `pnpm --filter portal test -- proxy.test.ts` or `pnpm --filter portal test -- --testPathPattern=proxy`

## Git & Commits

- Conventional Commits: `type(scope): description` — types: `feat|fix|chore|docs|refactor|perf|test|ci|build`
- Scope is the package or app: `feat(portal): add dashboard stats`
- Husky enforces commitlint + lint-staged (ESLint + Prettier)
- Never force-push to `main`/`master`

## Key Rules

- Never use npm or yarn — use `pnpm add` only (pnpm 9)
- New packages must be added to `pnpm-workspace.yaml` and `turbo.json`
- Application logic goes in `apps/portal/`, not in `packages/`
- Packages never import from `apps/`
- Throw `AppError` subclasses from `@repo/errors` — never raw `new Error()` for domain errors
- **Light-only** UI (AGENTS.md §7 / DECISIONS #003). Login reference: `apps/portal/src/app/(auth)/login/page.tsx` — control paints via `--login-*`, shell via `--os-shell-*` (DECISIONS #010)
- All interactive elements must be keyboard-navigable with visible focus rings
- Use `next/image` for all images — never raw `<img>` tags. Exception: signed Supabase storage URLs with rotating signatures (e.g. `card-actions-view.tsx`) where `next/image` cannot handle URL expiry.
- Lazy-load heavy Client Components with `next/dynamic` + `{ ssr: false }`
- Never commit `.env.local` or any secrets
- Always at the end of an output, present the user with 3 Recommended Follow-ups (with an `Outcome:` line under each follow-up). Never suggest creating or following `.kiro/specs/` in recommendations (apply spec-first automatically for tasks).
- Always create a new spec under `.kiro/specs/<feature-slug>/` for any upcoming multi-file feature or task before implementation

## Portal Architecture Details

- **Auth/authorization**: `apps/portal/proxy.ts` is the central middleware (successor to `middleware.ts`) — handles session, role, department, and route-restriction logic. The `employees` table is the source of truth for roles. Server Components use `getUserSafely()` from `@repo/supabase/server`.
- **API proxy**: `apps/portal/src/app/api/backend/[[...slug]]/` proxies all HTTP methods to the NestJS backend (`API_BASE_URL`, default `http://localhost:3004/api`) so the browser talks to a single origin.
- **Telemetry**: `apps/portal/instrumentation.ts` registers OpenTelemetry via `@vercel/otel` and Catalyst tracing via `@inference/tracing` (when `CATALYST_OTLP_TOKEN` is set).
- **Agent tracing**: When modifying portal code, update `apps/portal/AGENT_TRACER.md` with a dated entry and leave `// AGENT-TRACE:` breadcrumbs for complex logic.
- **External services at runtime**: Supabase, Redis, Ollama, NestJS API. See `.env.example` files.

## Real-World Thinking & Proven Methods

### Engineering Principles (AGENTS.md §20.2)

- **Start with simplest solution** - Don't over-engineer; implement minimum viable solution first
- **Progressive enhancement** - Make it work → make it right → make it fast
- **Production mindset** - Consider monitoring, debugging, maintenance costs
- **Evidence-based decisions** - Prefer data over opinions, benchmark before optimizing
- **Learn from production** - Real user problems > theoretical edge cases
- **Fail fast** - Detect problems early, don't silently swallow errors

### Engineering Heuristics

- **YAGNI** - You Ain't Gonna Need It (don't build features before needed)
- **KISS** - Keep It Simple, Stupid (complexity = reliability enemy)
- **DRY** - Don't Repeat Yourself (but know when duplication beats wrong abstraction)
- **Single Responsibility** - One reason to change, one thing to fix
- **Measure everything** - Can't improve what you don't measure

## Alignment Scoring (AGENTS.md §20)

```
Alignment: <score>/100 [<PASS|FAIL>]
- Spec: <n>/20 — <evidence>
- Stack: <n>/15 — <evidence>
- Boundaries: <n>/15 — <evidence>
- Security: <n>/20 — <evidence>
- Quality: <n>/15 — <evidence>
- Verify: <n>/15 — <evidence>
Hard fails: <none | list>
```

**Pass threshold: ≥ 80**. Any AGENTS.md §18 never-do violation → **hard fail (score = 0)**.

### Scoring Dimensions

| Dimension         | Pts | Evidence Required                                                       |
| ----------------- | --- | ---------------------------------------------------------------------- |
| Spec compliance   | 20  | Multi-file → `.kiro/specs/` phases followed; single-file → N/A full pts |
| Stack fidelity    | 15  | pnpm, Next 16 patterns, `@repo/*`, no banned deps                       |
| Boundaries        | 15  | Server/client correct; no server-only imports in client                 |
| Security          | 20  | Zod on input; no secrets; no service-role leakage                       |
| Quality gate      | 15  | `pnpm quality` (or scoped equivalent) passed this session               |
| Real-world verify | 15  | Observed runtime/test/read evidence for the claim                       |

### Helper Commands

```bash
# Run interactive alignment score
node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive

# Check if multi-file change needs specs
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l

# Create spec directory
mkdir -p .kiro/specs/{feature-slug}
```

## Agents & Skills

Discovery index for project-local AI surfaces (policy source: `AGENTS.md`).

### Subagents (`.cursor/agents/`)

Hybrid layout: entry `<name>.md` + folder `<name>/`. Auto-routing: [`.cursor/rules/04-subagent-auto-routing.mdc`](.cursor/rules/04-subagent-auto-routing.mdc). Standard: [`.cursor/standards/agent-layout/STANDARD.md`](.cursor/standards/agent-layout/STANDARD.md).

| Agent                    | When to delegate                             |
| ------------------------ | -------------------------------------------- |
| `fast-outliner`          | Multi-step work — outline before specialists |
| `frontend-design`        | Branded/landing visual composition           |
| `frontend-implementer`   | Portal pages, components, Server Actions UI  |
| `nextjs-fullstack`       | Next.js full-stack vertical slices (portal)  |
| `ai-docs-sync`           | Skills, rules, agents, docs drift            |
| `sceptic`                | Before claiming done — adversarial review    |
| `idle-runner`            | Independent work while other agents blocked  |
| `ai-maintenance-checker` | Background AI layout/sync every prompt       |
| `vercel-brand-sync`      | Vercel-family brand assets                   |
| `openspec`               | OpenSpec change lifecycle (CLI)              |
| `aider`                  | Aider surgical headless edits                |
| `goose`                  | Goose recipes / MCP automation               |
| `omp`                    | omp heavy headless coding                    |
| `security`               | AppSec, vuln review, threat modeling         |
| `test-engineer`          | Test automation, flake diagnosis, E2E        |
| `db-optimizer`           | PostgreSQL/Supabase performance tuning       |
| `backend-architect`      | API design, service architecture             |
| `agency-lead`            | Background self-healing loops                |
| `agents-memory-updater`  | Update agent memory from transcripts        |
| `gap-analyst`            | Compile/gap log analysis                     |
| `spec-auditor`           | OpenSpec & AGENTS compliance                 |
| `routing-optimizer`      | Provider latency and cooldowns               |
| `patch-builder`          | Structural auto-patches                      |
| `root-cause-healer`      | Verify hypothesis → fix → harden             |
| `import-auditor`         | Import/path connectivity audit               |
| `ai-system-optimizer`    | AI surface bloat prune, layout compliance    |
| `reflection`            | Post-task critique, gap logging, self-improve |

### Claude Code (Anthropic)

Native surfaces under `.claude/`: `CLAUDE.md`, `settings.json`, `rules/`, synced `skills/` + `agents/`. Standard: [`.cursor/standards/claude-code/STANDARD.md`](.cursor/standards/claude-code/STANDARD.md).

Routing: `.cursor/rules/04-subagent-auto-routing.mdc` · Maintenance: `.cursor/rules/06-ai-maintenance-background.mdc` · Hooks: `.cursor/hooks/README.md` · Commands: [`.cursor/commands/`](.cursor/commands/) (e.g. `/swarm`)

**AI system:** `pnpm ai` · `.cursor/standards/ai-system/STANDARD.md`

### Skills

| Location          | Skills                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.cursor/skills/` | `agent-alignment-score`, `skill-self-improve`, `ai-system`, `skill-layout`, `agent-layout`, `claude-code-layout`, `continual-learning`, `provider-router`, `redis-caching` |
| `.qoder/skills/`  | `quality`, `verify` (portal alias), `specs`, `dev`, `deploy`, `rls-audit`                                                                            |
| `.github/skills/` | `verify-changes` (alias → `quality` full), `frontend-api-integration-patterns`                                                                       |

Each skill folder: `SKILL.md` + `scripts/` + `references/` + `assets/`. See `.cursor/skills/README.md` for layout and commands.

**Canonical standard:** `.cursor/standards/agent-skills/STANDARD.md` — full index (install, discovery, marketplaces, curated collections).

**Validate:** `pnpm ai check` (unified — skills + agents + claude-code + guardrails)

**Agents:** hybrid layout per `.cursor/standards/agent-layout/STANDARD.md`

**Claude Code:** `.claude/` + [`.cursor/standards/claude-code/STANDARD.md`](.cursor/standards/claude-code/STANDARD.md)

**Score split:** `sceptic` → verdict + estimate; `agent-alignment-score` → formal score block.
