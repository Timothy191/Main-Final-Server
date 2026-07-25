---
title: Knowledge Base Index
tags: [index, meta]
updated: 2026-07-25
source_agent: buffy
status: active
---

# Knowledge Base Index

Single source of truth for cross-agent codebase knowledge. Read
[`README.md`](README.md) for the read/write protocol before contributing.

## Architecture

- [Addition Roadmap: arch-systems](architecture/monorepo-roadmap.md) — extraction candidates from Projects.

- [Addition Roadmap: primitives](architecture/radix-primitives-roadmap.md) — extraction candidates from radix-primitives.

- [Addition Roadmap: lucide](architecture/lucide-roadmap.md) — extraction candidates from lucide.

- [Addition Roadmap: ui](architecture/shadcn-ui-roadmap.md) — extraction candidates from shadcn-ui.

- [Monorepo boundaries & stack](architecture/monorepo-boundaries.md) — the two-layer
  product/agentic split, `@repo/*` packages, and hard boundary rules.
- [Portal auth & routing](architecture/portal-auth-and-routing.md) — `proxy.ts`
  enforcement, route groups, departments, path aliases.
- [AI orchestration & memory](architecture/ai-orchestration-and-memory.md) — embedding
  provider, background jobs, external AI tools, and the product `memory_embeddings` runtime feature.
- [Health checks & observability](architecture/health-and-observability.md) — Kubernetes
  readiness/liveness probes, Prometheus metrics, and health endpoint map.
- [Performance Bottleneck Analysis & Recommendations](architecture/performance-bottlenecks.md) —
  audit of 1.7GB node_modules, 4GB pnpm cache, tsconfig type-checking gaps, and build size.

## Decisions

- [Global decision log](decisions/index.md) — numbered ADR-lite entries. Cross-links
  package-scoped logs such as [`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md).

## Patterns

- [Patterns index](patterns/README.md) — reusable solutions, gotchas, and recipes.
- [Layout Stability, Scripts & Telemetry](patterns/layout-stability-and-telemetry.md) — CLS minimization, script strategies, and Web Vitals client-side reporting.
- [Next.js 16 Server Actions & Turbopack gotchas](patterns/nextjs16-server-actions.md) — isolating client-imported server actions to prevent module factory errors.
- [Next.js 16 CacheHandler interface](patterns/nextjs16-cache-handler-interface.md) — the exact `get/set/refreshTags/getExpiration/updateTags` contract for custom `cacheHandlers.default`; why exporting a class produces `cacheHandler.get is not a function`.
- [Auto-formatting & Spec-First Global Policy](patterns/auto-formatting-and-specs.md) — background code formatting and mandatory spec-first cycle for multi-file tasks.
- [High-Scale Systems, Microservices, and Design Patterns](patterns/high-scale-system-patterns.md) — extracted patterns from system-design-101, microservices, and design patterns.
- [Redis Cache v2 — L1+L2 Two-Tier Pattern](patterns/redis-cache-v2.md) — in-memory L1 + Redis L2 with request coalescing and tag-based invalidation.
- [Minimal Agent Scaffolding](patterns/minimal-agent-scaffolding.md) — evidence from mini-swe-agent (>74% SWE-bench Verified in ~100 lines, bash-only) for preferring linear primitive tools over deep scaffolding in our agent/skill designs.
- [Agent-Computer Interface (ACI)](patterns/agent-computer-interface.md) — SWE-agent-derived contract every Bash-using agent inherits: output/runtime caps, no-TTY rule, forbidden-command set, minimal-child prelude.
- [Scratch Board Coordination](patterns/scratch-board-coordination.md) — concurrent-agent presence signalling via root `scratch_board/`: check-in / conflict-check / check-out protocol grounded in Aakash Gupta's Parallel Claude Code Agents guide and CoAgent's file-based concurrency primitives.
- [Dynamic MCP & Skill Loading Strategy](patterns/dynamic-mcp-and-skill-loading.md) — Smithery CLI, `defer_loading` pattern, and on-demand tool discovery to reduce agent bloat.
- [Agent & Skill Bloat Audit — Smithery Migration Plan](patterns/bloat-audit-and-smithery-migration.md) — audit of 45 agent/skill entries (~1.2 MB), migration priorities, and quick wins.


## Reference

- [Glossary](glossary.md) — domain + codebase vocabulary.

## How to add an entry

1. Create the Markdown file in the right folder with frontmatter (see
   [`README.md`](README.md)).
2. Cite file-path evidence for each claim.
3. Add a link to it here under the matching section.
