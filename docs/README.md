# Arch Systems Portal Documentation Directory

Welcome to the documentation directory for the Arch Systems Portal. This repository is organized into domain-specific subdirectories to make it easy to find architectural patterns, deployment guides, audits, and maps of the codebase.

## Directory Structure

### 🎨 [Design System](./design-system/) — global rule (mandatory)

The portal's visual system (glass/transparency, background animation, all tokens and visual aspects) is a **global rule** every agent must follow, apply, and keep updated. Authoritative docs:

- [RULES.md](./design-system/RULES.md) — the enforceable must/must-not list (one glass schema; no ad-hoc `backdrop-blur-*` / `bg-white/` on panels or cards; token tiers; fixed background animation; how to extend).
- [SPEC.md](./design-system/SPEC.md) — exact token values, class catalog, and visual contracts (`--arch-glass-*`, `--os-shell-*`, `.glass-card`, canvas/wave tokens, radii, shadows, typography, z-index).
- [DESIGN.md](./design-system/DESIGN.md) — intent, principles, surface roles, and the ambient background system.
- Structural decisions: [`packages/theme/DECISIONS.md`](../packages/theme/DECISIONS.md) (ADRs).

### 🏛️ [Architecture](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/architecture/)

Architectural designs, scalability references, and gap analyses.

- [Architecture Diagrams](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/architecture/architecture-diagrams.md) — Visualizations of the data flow and system structure.
- [Foundational Architecture & Gap Analysis](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/architecture/foundational-architecture-gap-analysis.md) — Comprehensive gap analysis of the existing layers.
- [Scalability & Architecture Reference](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/architecture/scalability-architecture-reference.md) — Core scalability guidelines and design principles.

### 🛡️ [Compliance](./compliance/)

Compliance framework mapping industrial/mining regulations to the operational
software stack, with system criticality classification, validation strategy, and
governance.

- [Compliance Architecture](./compliance/compliance-architecture.md) — Top-level
  framework: system inventory (SI-ARCH-2026-001), criticality classification
  (SCC-ARCH-2026-001), GAMP 5 categories, regulatory traceability
  (RRTM-ARCH-2026-001), validation strategy, governance, and an assumptions /
  remediation log. Draft — assumptions in §10 must be confirmed before approval.

### 🔍 [Audits](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/audits/)

Codebase audits, duplication analyses, and type error logs.

- [Backend Audit](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/audits/backend-audit.md) — Security and structure audit of the backend.
- [Duplication Audit](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/audits/duplication-audit.md) — Identification of redundant components and utilities.
- [Type Error Catalog](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/audits/type-error-catalog.md) — Catalog of TypeScript type-checking errors and resolutions.

### ⚡ [Caching](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/caching/)

Redis and application-level caching strategies.

- [Caching Strategy Research](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/caching/caching-strategy-research.md) — Detailed research on caching mechanisms.
- [Redis Caching Redesign](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/caching/redis-caching-redesign.md) — Plan and structure for Redis rate-limiting and session caching.

### 🗺️ [Codebase Maps](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/)

High-level and low-level maps of workspace directories, dependencies, and boundaries.

- [Codebase Maps README](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/README.md) — Overview of the code mapping strategy.
- [API Routes Map](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/api-routes.md)
- [Architectural Graph & Tooling](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/architectural-graph-matrix-and-tooling.md)
- [Caching Layers Map](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/caching-layers.md)
- [Client/Server Boundaries](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/client-server-boundaries.md)
- [Data Flow & API Map](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/data-flow-and-api-map.md)
- [Dataflow Pipelines](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/dataflow-pipelines.md)
- [Monorepo Structure Map](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/monorepo-structure-map.md)
- [Packages & Dependencies Map](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/packages-and-dependencies-map.md)
- [Workspace Packages Directory](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/codebase-maps/workspace-packages.md)

### 🚀 [Deployment](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/deployment/)

Deployment guides and production scripts verification checklists.

- [Deployment Guide](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/deployment/deployment.md) — Step-by-step instructions for production and staging setup.
- [dev.sh Test Checklist](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/deployment/dev-sh-test-checklist.md) — Operational verification checklist.

### 🔄 [Migration](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/migration/)

Detailed path for NestJS to Next.js migration and modular conversions.

- [NestJS to Next.js Migration Plan](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/migration/nestjs-to-nextjs-migration.md) — Architectural map of the migration.
- [Migration Analysis](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/migration/migration-analysis.md) — Gap analysis and strategy.

### 🏎️ [Performance](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/performance/)

Optimizations and client/server efficiency research.

- [Client-Side Computing Improvements](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/performance/client-side-computing-improvements.md) — Optimization plan for client-side computing resource allocation.
- [CSS Selector Costs](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/performance/css-selector-costs.md) — Analysis of CSS selector rendering overhead.
- [DevTools Performance Insights Index](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/performance/insights/README.md) — Reference guides and optimization strategies for DevTools Performance Panel insights.

### ⚡ [Optimization](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/optimization/)

Framework-level optimization research and recommendations.

- [Next.js 16 Optimization Reference](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/optimization/nextjs-optimization-reference.md) — Caching, images, fonts, bundling, PPR, and bundle analysis best practices.
- [TypeScript Monorepo Optimization Guide](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/optimization/typescript-optimization-guide.md) — Module resolution, config flags, project references, and performance tuning.

### 🚨 [Runbooks](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/runbooks/)

Operational runbooks for responding to Prometheus alerts from the cache
and circuit breaker monitoring stack.

- [Runbooks Index](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/runbooks/README.md)
  — Quick-reference table mapping alerts to runbooks.
- [Circuit Breaker Open](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/runbooks/circuit-breaker-open.md)
  — Diagnosis and resolution for when the cache circuit breaker trips open.
- [Redis Connection Down](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/runbooks/redis-connection-down.md)
  — Recovery steps when the Redis connection is lost.

### ✨ [Superpowers](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/superpowers/)

Experimental capabilities and visual system plan logs.

- [Plans](file:///home/arch/Desktop/New%20Folder/arch-systems-portal/docs/superpowers/plans/)
