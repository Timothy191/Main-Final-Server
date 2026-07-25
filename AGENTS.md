# AGENTS.md

This file provides guidance to the AI agent when working with code in this repository.

## Project shape

Turborepo 2 + pnpm 9 monorepo. Node `>=22` (Volta pins `24.15.0`), pnpm `9.15.9`.

- `apps/portal/` — primary Next.js 16 App Router UI. Has its own `apps/portal/AGENTS.md`; **consult it for portal specifics** (auth via `proxy.ts` not `middleware.ts`, department routes, RSC/Server Actions patterns).
- `apps/ops-gateway/` — MCP bridge / control-plane service.
- `apps/api-gateway/` — GraphQL Mesh gateway (CommonJS).
- `packages/*` — framework-agnostic libs: `@repo/contract`, `@repo/database`, `@repo/errors`, `@repo/redis`, `@repo/supabase`, `@repo/theme`, `@repo/ui`, `@repo/utils`, `@repo/rate-limiter`, `@repo/logger`, `@repo/llm-config`, `@repo/departments`, `@repo/eslint-config`, `@repo/typescript-config`.

Boundary: never import from `apps/*` inside `packages/*`. Never add application logic to `packages/*`.

## Commands the AI would guess wrong

- `pnpm dev` runs `scripts/dev.sh` (Redis via `docker compose --profile infra`, then Supabase, then portal Turbopack). Use `pnpm dev --quick` or `pnpm dev --no-infra` for portal-only, no-Docker dev.
- `pnpm quality` = `turbo run lint type-check test --concurrency=4 && pnpm format:check`. The `quality` task defined in `turbo.json` is unused — do **not** invoke `turbo run quality`.
- Colon-separated, not space: `pnpm ai:check` (drift/guardrails validator, `scripts/ai.sh check`), `pnpm ai:fix`, `pnpm ai:init`. `pnpm ai` alone runs status.
- `pnpm agent:delegate` — task delegation via `scripts/delegate-agent.sh`.
- `pnpm audit:rls` — `node tools/audit-rls.cjs`; run after touching `packages/database/migrations/`.
- `pnpm supabase:start|stop|status` — invokes `pnpm dlx supabase --workdir packages`.
- Single-file test: `pnpm --filter=portal test -- path/to/file.test.ts`. Name pattern: `pnpm --filter=portal test -- -t "pattern"`.

## Code conventions

- TypeScript strict; no `any`, no `@ts-ignore`. Prefer `unknown` + type guards, `satisfies` over widening.
- **Prettier: `semi: false`, `singleQuote: true`**, `tabWidth: 2`, `trailingComma: "es5"`, `printWidth: 100`. A PostToolUse hook auto-runs `prettier --write` after every Write/Edit.
- Use `import type { X }` for type-only imports (enforced by `consistent-type-imports`). Prefer `@repo/*` aliases over relative imports across packages.
- Errors: throw typed `AppError` subclasses from `@repo/errors` — never raw `new Error()` for domain errors.
- Validation: Zod at every external boundary. All workspaces are pinned to zod `^3.24.0`; do not upgrade a single package to v4 without a monorepo-wide migration.
- Styling: Tailwind via `@repo/theme` preset; **light-mode only** (macOS Ventura/Sonoma liquid-glass palette). See `.qoder/rules/code-style.md`.
- Two Redis clients coexist by design: `ioredis` in `@repo/redis`, `redis` v4 in `ops-gateway`. Match the client the surrounding package already uses.
- `neverthrow` is **not** a dependency despite older docs — don't add it without a decision.

## Testing

- Jest 30 with `@swc/jest`, `jsdom`. Portal config: `apps/portal/jest.config.cjs`.
- Portal coverage thresholds: 40% lines, 30% branches, 35% functions, 40% statements.
- Co-locate unit tests (`foo.ts` → `foo.test.ts`). Integration tests in `__tests__/` under the feature.
- Mock Supabase / Redis / Inngest at the boundary. Never mock `@repo/utils` or `@repo/errors`.
- Run `pnpm quality` before marking any task done.

## Security & boundaries

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any non-`NEXT_PUBLIC_` env var to the client.
- Never import `@repo/supabase/server` or `@repo/redis` from a `"use client"` file. `"use client"` never on layouts.
- A PreToolUse hook blocks writes to `.env*.local` files and destructive Bash (`rm -rf /`, `git push --force main/master`, `npm|yarn install|add`).

## Spec-driven workflow

- Multi-file changes: create `.kiro/specs/<feature-slug>/{requirements,design,tasks}.md` before implementation. Templates in `.kiro/templates/`.
- Caveat: `.kiro/specs/` is `.gitignore`d — specs are local per developer. Persist durable, cross-agent decisions in `.agents/knowledge/` (repowiki) instead.

## Shared knowledge base

- `.agents/knowledge/` is the cross-agent source of truth. Read `.agents/knowledge/index.md` before non-trivial work; add durable, dated, evidence-cited learnings and update `index.md` — supersede, never delete.

## Commits

- Conventional commits enforced by commitlint: `type(scope): subject`. Types: `feat|fix|chore|refactor|docs|test|style|perf|build|ci|revert`. Scope matches the app/package (`portal`, `ops-gateway`, `repo/supabase`, …). Subject is not sentence-case.
- Husky runs `pnpm exec lint-staged` on pre-commit (prettier + eslint on staged TS files) and `commitlint` on commit-msg.

## Local overrides

- Create `AGENTS.local.md` (gitignored) for personal, per-user rules that shouldn't be committed. It loads with higher priority than this file.

## Detailed rules & skills

Path-scoped rules loaded automatically:
- `.qoder/rules/code-style.md` — TS/TSX naming, styling
- `.qoder/rules/security.md` — server/client boundary details
- `.qoder/rules/testing.md` — Jest patterns
- `.qoder/rules/spec-driven-workflow.md` — spec phase enforcement
- `.qoder/rules/alignment-scoring.md` — OBSERVE→VERIFY→ACT→SCORE loop

On-demand skills (invoke with `/<name>`): `dev`, `quality`, `verify` (portal-scoped quality), `specs`, `rls-audit`, `deploy`.

Portal-specific rules and Next.js 16 breaking-change notes live at `apps/portal/AGENTS.md`.
