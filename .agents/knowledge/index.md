---
title: Knowledge Base Index
tags: [index, meta]
updated: 2026-07-23
source_agent: claude-code
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
- [AI orchestration & memory](architecture/ai-orchestration-and-memory.md) — LangGraph
  agent graph, `lib/ai/` subsystem, and the product `memory_embeddings` runtime feature.
- [Health checks & observability](architecture/health-and-observability.md) — Kubernetes
  readiness/liveness probes, Prometheus metrics, and health endpoint map.

## Decisions

- [Global decision log](decisions/index.md) — numbered ADR-lite entries. Cross-links
  package-scoped logs such as [`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md).

## Patterns

- [Patterns index](patterns/README.md) — reusable solutions, gotchas, and recipes.
- [Layout Stability, Scripts & Telemetry](patterns/layout-stability-and-telemetry.md) — CLS minimization, script strategies, and Web Vitals client-side reporting.
- [Next.js 16 Server Actions & Turbopack gotchas](patterns/nextjs16-server-actions.md) — isolating client-imported server actions to prevent module factory errors.
- [Auto-formatting & Spec-First Global Policy](patterns/auto-formatting-and-specs.md) — background code formatting and mandatory spec-first cycle for multi-file tasks.
- [High-Scale Systems, Microservices, and Design Patterns](patterns/high-scale-system-patterns.md) — extracted patterns from system-design-101, microservices, and design patterns.
- [Redis Cache v2 — L1+L2 Two-Tier Pattern](patterns/redis-cache-v2.md) — in-memory L1 + Redis L2 with request coalescing and tag-based invalidation.


## Reference

- [Glossary](glossary.md) — domain + codebase vocabulary.

## How to add an entry

1. Create the Markdown file in the right folder with frontmatter (see
   [`README.md`](README.md)).
2. Cite file-path evidence for each claim.
3. Add a link to it here under the matching section.
