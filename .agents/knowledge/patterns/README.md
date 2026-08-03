---
title: Patterns index
tags: [patterns, recipes, gotchas]
updated: 2026-07-21
source_agent: claude-code
status: active
---

# Patterns

Reusable solutions, recipes, and non-obvious gotchas promoted from real work. Add an
entry when you solve something another agent will likely hit again. Each pattern: what
the problem is, the solution, and a file-path citation.

## Seed patterns

### Verify before "done"

Run `pnpm quality` (lint + type-check + test + prettier) before marking any task
complete. For portal-only changes, `pnpm --filter portal <cmd>` scopes the run. Grounded
in [`AGENTS.md`](../../../AGENTS.md) and [`CLAUDE.md`](../../../CLAUDE.md).

### Safe user lookup in Server Components

Use `getUserSafely()` from `@repo/supabase/server` in RSC to avoid crashes on stale
sessions; do not call the raw client getter in a Server Component. Grounded in
[`apps/portal/GEMINI.md`](../../../apps/portal/GEMINI.md) and
[`apps/portal/AGENTS.md`](../../../apps/portal/AGENTS.md).

### Data access boundary

In the portal, reach the database through `@repo/supabase`, never `@repo/database`
directly. Throw `AppError` subclasses from `@repo/errors` for domain errors. Grounded in
[`CLAUDE.md`](../../../CLAUDE.md).

### Next.js 16 Caching & Auth Pattern

Use the native `"use cache"` directive without breaking caching. Separate auth functions (which use `cookies()`) into an outer dynamic function, and then use `createAdminClient()` inside the inner cached function. Grounded in [`apps/portal/src/app/(departments)/access-control/actions.ts`](../../../apps/portal/src/app/(departments)/access-control/actions.ts). See [nextjs16-caching.md](nextjs16-caching.md) for full details.

### Layout Stability, Script Strategies & Telemetry

Maintain a low Cumulative Layout Shift (CLS), optimize third-party scripts, and measure performance metrics using Web Vitals APIs. See [layout-stability-and-telemetry.md](layout-stability-and-telemetry.md) for full details.

### Redis Cache v2 — L1+L2 Two-Tier Pattern

Two-tier caching with in-memory L1 (1000 entries, LRU eviction, 30s max TTL) and Redis L2. Includes request coalescing, tag-based invalidation, and stats tracking. See [redis-cache-v2.md](redis-cache-v2.md) for full details.

---

Promote deeper recipes into their own file in this folder (with frontmatter) and link it
from [`../index.md`](../index.md).

