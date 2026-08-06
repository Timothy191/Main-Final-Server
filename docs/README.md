# Arch Systems Portal Documentation Directory

Welcome to the documentation directory for the Arch Systems Portal. This repository is organized into domain-specific subdirectories to make it easy to find architectural patterns, deployment guides, audits, and maps of the codebase.

## Directory Structure

### 🎨 [Design System](./design-system/) — global rule (mandatory)

The portal's visual system (glass/transparency, background animation, all tokens and visual aspects) is a **global rule** every agent must follow, apply, and keep updated. Authoritative docs:

- [RULES.md](./design-system/RULES.md) — the enforceable must/must-not list (one glass schema; no ad-hoc `backdrop-blur-*` / `bg-white/` on panels or cards; token tiers; fixed background animation; how to extend).
- [SPEC.md](./design-system/SPEC.md) — exact token values, class catalog, and visual contracts (`--arch-glass-*`, `--os-shell-*`, `.glass-card`, canvas/wave tokens, radii, shadows, typography, z-index).
- [DESIGN.md](./design-system/DESIGN.md) — intent, principles, surface roles, and the ambient background system.
- Structural decisions: [`packages/theme/DECISIONS.md`](../packages/theme/DECISIONS.md) (ADRs).

### 🏛️ [Architecture](./architecture/)

Architectural designs, scalability references, and gap analyses.

- [Architecture Diagrams](./architecture/architecture-diagrams.md) — Visualizations of the data flow and system structure.
- [Foundational Architecture & Gap Analysis](./architecture/foundational-architecture-gap-analysis.md) — Comprehensive gap analysis of the existing layers.
- [Scalability & Architecture Reference](./architecture/scalability-architecture-reference.md) — Core scalability guidelines and design principles.

### 🛡️ [Compliance](./compliance/)

Compliance framework mapping industrial/mining regulations to the operational
software stack, with system criticality classification, validation strategy, and
governance.

- [Compliance Architecture](./compliance/compliance-architecture.md) — Top-level
  framework: system inventory (SI-ARCH-2026-001), criticality classification
  (SCC-ARCH-2026-001), GAMP 5 categories, regulatory traceability
  (RRTM-ARCH-2026-001), validation strategy, governance, and an assumptions /
  remediation log. Draft — assumptions in §10 must be confirmed before approval.

### 🔍 [Audits](./audits/)

Codebase audits and security reviews.

- [Backend Audit](./audits/backend-audit.md) — Security and structure audit of the backend.

### ⚡ [Caching](./caching/)

Redis and application-level caching strategies.

- [Caching Strategy Research](./caching/caching-strategy-research.md) — Detailed research on caching mechanisms.
- [Redis Caching Redesign](./caching/redis-caching-redesign.md) — Plan and structure for Redis rate-limiting and session caching.

### 🧠 [Architectural Insights & Memory](../memory/ARCHITECTURAL_INSIGHTS.md)

High-level architecture, module maps, and client-server boundary rules are indexed in [`memory/ARCHITECTURAL_INSIGHTS.md`](../memory/ARCHITECTURAL_INSIGHTS.md).

### 🚀 [Deployment](./deployment/)

Deployment guides and production scripts verification checklists.

- [Deployment Guide](./deployment/deployment.md) — Step-by-step instructions for production and staging setup.
- [dev.sh Test Checklist](./deployment/dev-sh-test-checklist.md) — Operational verification checklist.

### 🔄 [Migration](./migration/)

Migration analyses and modular conversion strategy.

- [Migration Analysis](./migration/migration-analysis.md) — Gap analysis and strategy.

### 🏎️ [Performance](./performance/)

Optimizations and client/server efficiency research.

- [Client-Side Computing Improvements](./performance/client-side-computing-improvements.md) — Optimization plan for client-side computing resource allocation.

### ⚡ [Optimization](./optimization/)

Framework-level optimization research and recommendations.

- [Next.js 16 Optimization Reference](./optimization/nextjs-optimization-reference.md) — Caching, images, fonts, bundling, PPR, and bundle analysis best practices.
- [TypeScript Monorepo Optimization Guide](./optimization/typescript-optimization-guide.md) — Module resolution, config flags, project references, and performance tuning.

### 🚨 [Runbooks](./runbooks/)

Operational runbooks for responding to Prometheus alerts from the cache
and circuit breaker monitoring stack.

- [Runbooks Index](./runbooks/README.md)
  — Quick-reference table mapping alerts to runbooks.
- [Circuit Breaker Open](./runbooks/circuit-breaker-open.md)
  — Diagnosis and resolution for when the cache circuit breaker trips open.
- [Redis Connection Down](./runbooks/redis-connection-down.md)
  — Recovery steps when the Redis connection is lost.

### ✨ [Superpowers](./superpowers/)

Experimental capabilities and visual system plan logs.

- [Plans](./superpowers/plans/)
