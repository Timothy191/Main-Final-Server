# Codebase Maps

This directory contains visual and structured reference maps of the **Arch Systems Portal** monorepo architecture, application layers, packages, data flows, caching layers, and server/client boundaries.

---

## Complete Index of Maps

| Map Document                                                                               | Description                                                                                                            |
| :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| [`workspace-packages.md`](./workspace-packages.md)                                         | Complete topology of workspace apps (`apps/portal`, `apps/ops-gateway`, `apps/api-gateway`) and 14 `@repo/*` packages. |
| [`api-routes.md`](./api-routes.md)                                                         | Index of all 51 portal API routes and gateway endpoints categorized by domain.                                         |
| [`dataflow-pipelines.md`](./dataflow-pipelines.md)                                         | Telemetry ingestion, Inngest 4 background jobs (8 functions), webhooks, event dispatching.                             |
| [`caching-layers.md`](./caching-layers.md)                                                 | Next.js 16 `"use cache"`, `cacheTag()`, hybrid L1 memory / L2 Redis mesh, auth decoupling protocol.                    |
| [`client-server-boundaries.md`](./client-server-boundaries.md)                             | Server Actions (`'use server'`), Server Components vs Client Components (`'use client'`), runtime data boundaries.     |
| [`monorepo-structure-map.md`](./monorepo-structure-map.md)                                 | High-level monorepo directory structure, layout rules, and workspace boundaries.                                       |
| [`packages-and-dependencies-map.md`](./packages-and-dependencies-map.md)                   | Dependency graph of `@repo/*` packages, key exports, and isolation guarantees.                                         |
| [`data-flow-and-api-map.md`](./data-flow-and-api-map.md)                                   | Overview map of client-to-server request flow, middleware, route handlers, and Supabase RLS.                           |
| [`architectural-graph-matrix-and-tooling.md`](./architectural-graph-matrix-and-tooling.md) | 4-layer graph matrix (Workspace, Next.js Codebase, Dataflow/Backend, Observability) and tooling stack.                 |

---

## Monorepo Architecture Overview

```text
                      +----------------------------------+
                      |         Portal UI (App)          |
                      |     apps/portal (Next.js 16)     |
                      +----------------+-----------------+
                                       |
           +---------------------------+---------------------------+
           |                           |                           |
           v                           v                           v
+--------------------+      +--------------------+      +--------------------+
|  @repo/contract    |      |  @repo/supabase    |      |    @repo/redis     |
| (Zod Validation)   |      | (Auth, PostgREST)  |      | (L1/L2 Cache Mesh) |
+--------------------+      +--------------------+      +--------------------+
           |                           |                           |
           +---------------------------+---------------------------+
                                       |
                                       v
                      +----------------------------------+
                      |     Control Plane / Gateway      |
                      |   apps/ops-gateway (MCP Bridge)  |
                      |   apps/api-gateway (GraphQL Mesh)|
                      +----------------------------------+
```
