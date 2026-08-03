---
title: Global decision log
tags: [decisions, adr]
updated: 2026-07-21
source_agent: claude-code
status: active
---

# Global decision log

Numbered, append-only ADR-lite entries that affect the whole repo or cross package
boundaries. Format mirrors
[`packages/theme/DECISIONS.md`](../../../packages/theme/DECISIONS.md): `## NNN — Title`
with **Decision**, **Why**, **Status**. Supersede rather than delete; link successors.

Package-scoped logs remain authoritative for their package:

- [`packages/theme/DECISIONS.md`](../../../packages/theme/DECISIONS.md) — theme/design
  tokens. Notably #003 (light-only `color-scheme: light`) and #010 (login token surfaces).

---

## 001 — Shared agent knowledge base lives in `.agents/knowledge/`

**Decision**: Cross-agent codebase knowledge is stored as git-tracked Markdown under
`.agents/knowledge/`, registered as canonical in [`AGENTS.md`](../../../AGENTS.md),
exposed to tools via symlinks (`.claude/knowledge`, `.cursor/knowledge`,
`.qoder/repowiki`) created by
[`.claude/scripts/sync-surfaces.sh`](../../../.claude/scripts/sync-surfaces.sh), and
enforced by `pnpm ai check`.

**Why**: Every agent tool previously kept isolated memory (`.claude/memory/`,
`.serena/memories/`, `.crush/`, `.codeep/`), and the `repowiki`/`repowise` paths referenced
in `apps/portal/GEMINI.md` never existed. A single git-tracked source of truth is readable
by every agent (even those without MCP), diff-reviewable, versioned, and works offline.

**Status**: Accepted. Markdown is the source of truth now; MCP/vector retrieval can layer
on later without moving it. The runtime `memory_embeddings` product feature
(`009_ai_memory.sql`) is intentionally kept separate.

---

## 002 — Monorepo moved to Server/ subfolder

**Decision**: The entire product codebase was moved into `Server/` to separate agentic and product boundaries. Husky pre-commit hooks were adjusted to execute commands inside the `Server/` subfolder.

**Why**: Clarifies the boundary between the active product codebase and the agent/AI harnesses at the workspace root, preventing clutter.

**Status**: Accepted.

---

## 003 — Redis offline circuit breaker (Connection Cooldown)

**Decision**: Added a 10-second connection cooldown in `packages/redis/src/client.ts` to skip reconnection attempts if the server is offline.

**Why**: When Redis is down (e.g. Docker not running locally), every page request stalled for several hundred milliseconds trying to connect. The circuit breaker restores sub-second local load speeds by immediately failing back to in-memory/direct DB mode.

**Status**: Accepted.

---

## 004 — 9Router Embeddings Job Implementation

**Decision**: Replaced stubs in `apps/portal/src/lib/jobs/embedding-generation.ts` with direct client calls to 9Router's embeddings API, storing results in `embedding_cache`.

**Why**: Connects the speculative logging embedding event to the live local/remote AI gateway.

**Status**: Accepted.

---

## 005 — Cumulative Layout Shift (CLS) Optimization

**Decision**: Converted all remaining HTML `<img>` elements in `TrustLogos.tsx`, `DepartmentReviews.tsx`, `card-actions-view.tsx`, and `CardActionsTab.tsx` to Next.js's `<Image>` component with relative container bounds.

**Why**: Prevents cumulative layout shifts (CLS) on dynamic image resolutions, improving user experience and visual stability metrics.

**Status**: Accepted.

---

## 006 — Redis Cache v2: L1+L2 Two-Tier Architecture

**Decision**: Implemented two-tier caching in `packages/redis/src/cache.ts` with in-memory L1 (1000 entries, LRU eviction, 30s max TTL) and Redis L2. Added `Cache` class with unified API, tag-based invalidation, and request coalescing.

**Why**: Single-tier Redis caching added latency on every read. L1 memory cache provides sub-millisecond access for hot keys while L2 Redis provides distributed persistence. Request coalescing prevents cache stampede on misses.

**Status**: Accepted.

---

## 007 — Portal CI Pipeline with Bundle Analysis

**Decision**: Added `.github/workflows/portal-ci.yml` with four jobs: quality gate (type-check, lint, test), structured data validation, build check, and bundle analysis with size-limit tracking.

**Why**: Automated quality gates prevent regressions. Bundle analysis tracks Supabase dependency footprint and ensures page chunks stay under 350KB. Size-limit config at `apps/portal/.size-limit.json` enforces budgets.

**Status**: Accepted.

---

## 008 — Supabase Dependency Slimming

**Decision**: Removed Supabase CLI from `@repo/supabase` dependencies, keeping only `@supabase/ssr` and `@supabase/supabase-js`. CLI commands now use `pnpm dlx supabase@^2.26.0` on-demand.

**Why**: Supabase CLI is only needed for local dev/scripts, not runtime. Removing it from dependencies reduces install size and avoids pulling CLI into production builds.

**Status**: Accepted.
