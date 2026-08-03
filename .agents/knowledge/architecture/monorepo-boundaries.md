---
title: Monorepo boundaries & stack
tags: [architecture, monorepo, packages, boundaries, stack]
updated: 2026-07-21
source_agent: claude-code
status: active
---

# Monorepo boundaries & stack

Grounded in [`AGENTS.md`](../../../AGENTS.md) and [`CLAUDE.md`](../../../CLAUDE.md).

## Two-layer split (hard boundary)

- **Product layer** — `apps/`, `packages/`, product scripts, and `turbo` tasks. Must
  build, run, and test with zero AI/agentic content.
- **Agentic layer** — `.cursor/`, `.claude/`, `AGENTS.md`, `pnpm ai`, and maintenance
  scripts. CLI-agent tooling only.
- Contract: `.cursor/standards/layer-boundary/STANDARD.md` (referenced from `CLAUDE.md`).

## Apps

- `apps/portal/` — primary deployable Next.js 16 (App Router) UI. See
  [Portal auth & routing](portal-auth-and-routing.md).
- `apps/ops-gateway/` — MCP bridge, dispatcher, and subscriber services for external
  integrations and event-driven tasks.

## Packages (`@repo/*`, framework-agnostic)

`@repo/contract`, `@repo/database`, `@repo/departments`, `@repo/errors`,
`@repo/eslint-config`, `@repo/logger`, `@repo/rate-limiter`, `@repo/redis`,
`@repo/supabase`, `@repo/theme`, `@repo/typescript-config`, `@repo/ui`, `@repo/utils`.

### `@repo/redis` — L1+L2 Cache System (v2)

Two-tier caching with in-memory L1 (1000 entries, LRU eviction) and Redis L2:
- `cacheGet()`, `cacheSet()`, `cacheWrap()` — core operations
- `cacheSetWithTags()` — tag-based invalidation
- `Cache` class — unified API with prefix support
- Request coalescing (single-flight) prevents duplicate fetches
- Stats tracking: `recordCacheHit()`, `recordCacheMiss()`, `recordRedisError()`
- See [Redis Cache v2 Pattern](../patterns/redis-cache-v2.md)

## Hard rules (do not violate)

- **Never import from `apps/` inside `packages/`.** Packages stay framework-agnostic.
- **Never add application logic to `packages/`.**
- In the portal, do data access via `@repo/supabase`, **not** `@repo/database` directly
  (data-boundary rule).
- Throw typed `AppError` subclasses from `@repo/errors` — never raw `new Error()` for
  domain errors.
- Validate all external input with **Zod**.
- Styling via Tailwind + `@repo/theme`, **light-mode only** (see
  [decisions](../decisions/index.md) and `packages/theme/DECISIONS.md` #003).

## Stack / tooling

- **Package manager:** pnpm 9 only — never npm or yarn.
- **Build:** Turborepo 2 (`turbo.json`).
- **Runtime:** Node.js >= 22 (Volta pinned 24).
- **Language:** TypeScript 5.7+ strict — no `any`, no `@ts-ignore`.
- **Background jobs:** Inngest 4.
- **Infra:** Supabase (auth/DB), Redis (cache/rate-limit), Sentry (errors),
  OpenTelemetry (observability).

## Quality gate

`pnpm quality` (lint + type-check + test + prettier) must pass before marking work done.
