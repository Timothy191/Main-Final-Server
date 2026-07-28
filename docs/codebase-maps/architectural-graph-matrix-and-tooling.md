# Architectural Graph Matrix & Tooling Guide

When managing the **Arch Systems Portal** monorepo containing a full-stack Next.js setup (Next.js 16 App Router, Server Actions, multiple apps/packages, and shared libraries), we operate across **four distinct architectural layers**: Workspace, Application Code, Dataflow/Backend, and Operational/Observability.

---

## 1. Monorepo & Workspace-Level Graphs

_Visualizes how projects, workspace packages, and build tasks depend on one another._

```text
                 [ apps/portal ] ───────┐
                        │               │
                        ▼               ▼
  [ packages/ui ] ──► [ @repo/contract ] ◄── [ apps/ops-gateway ]
```

- **Workspace Dependency Graph (Project Graph):**
  - **What it shows:** Dependencies between apps (`apps/portal`, `apps/ops-gateway`, `apps/api-gateway`) and internal workspace packages (`packages/contract`, `packages/redis`, `packages/supabase`, `packages/theme`).
  - **Primary Value:** Prevents circular workspace dependencies and identifies high-risk shared packages.
  - **Tools:** `turbo graph` (Turborepo), `pnpm graph`.

- **Task Execution / Build Directed Acyclic Graph (DAG):**
  - **What it shows:** The exact order in which build, lint, and test scripts must run based on package dependencies (e.g., build `@repo/contract` _before_ `apps/portal`).
  - **Primary Value:** Maximize parallel build tasks in CI/CD pipelines.
  - **Tools:** Turborepo CLI (`pnpm build`, `turbo run build --dry-run=json`).

---

## 2. Next.js Codebase & Module-Level Graphs

_Maps JavaScript/TypeScript imports, Next.js routing, and client-server boundaries._

- **Module Dependency Graph:**
  - **What it shows:** File-to-file import trees across TypeScript files.
  - **Primary Value:** Finding circular imports, dead code/unreachable files, and giant monolithic modules.
  - **Tools:** `madge`, `dependency-cruiser`.

- **Next.js Server/Client Boundary Graph:**
  - **What it shows:** Which components are React Server Components (RSC) vs. `'use client'` interactive trees.
  - **Primary Value:** Identifying accidental leakages of server-only code (or heavy Node modules like `@react-pdf/renderer` or `inngest`) into client bundles.
  - **Tools:** `@next/bundle-analyzer` (`pnpm --filter portal build:analyze`), `.eslintrc.cjs` (`no-restricted-imports`).

- **App Router Tree Graph:**
  - **What it shows:** Visual mapping of nested file-system layouts (`app/layout.tsx`, `(auth)`, `(departments)`).
  - **Primary Value:** Inspecting route inheritance, route groups, and parallel route slots.
  - **Tools:** `next-route-visualizer`, Next.js build output CLI summary.

---

## 3. Dataflow & Backend Architecture Graphs

_Maps how data moves between Server Actions, API routes, database models, and third-party services._

```text
[ Client Component ] ── (Server Action / API Route) ──► [ Supabase / Kysely ] ──► [ PostgreSQL ]
         │                                                      │
         └───────────── (Fetch /api/auth/logout) ───────────────┴──► [ Redis Cache ]
```

- **Database Schema & Entity-Relationship Diagram (ERD):**
  - **What it shows:** Supabase PostgreSQL tables, foreign key relationships, RLS policies, and field types.
  - **Primary Value:** Visualizing relational database structures and migration changes (`@repo/database`).
  - **Tools:** Supabase Studio, Drizzle Kit (`drizzle-kit visualize`), SchemaSpy.

- **API & Route Flow Graph:**
  - **What it shows:** Links between frontend components, Next.js 16 Server Actions, and REST Route Handlers (`app/api/.../route.ts`).
  - **Primary Value:** Tracing full end-to-end data mutations from a button click to the database.
  - **Tools:** Swagger UI (`next-swagger-doc`), OpenAPI spec (`node scripts/generate-openapi-spec.js`).

- **State & Event Dataflow Graph:**
  - **What it shows:** How state flows through client-side state managers (Zustand) or asynchronous messaging pipelines.
  - **Primary Value:** Debugging complex UI state machines or event buses.
  - **Tools:** Redux DevTools State Graph, Zustand devtools.

---

## 4. Observability & Runtime Graphs

_Captures dynamic, live production behavior rather than static code._

- **Distributed Tracing / Service Dependency Graph:**
  - **What it shows:** Real-time requests hopping from Next.js SSR servers to external microservices, databases, or third-party APIs.
  - **Primary Value:** Identifying latent API calls, slow SQL queries, and cascading network failures in production.
  - **Tools:** OpenTelemetry (`@vercel/otel`), Jaeger/Zipkin, Datadog Service Map.

- **Core Web Vitals & Performance Graphs:**
  - **What it shows:** Real User Monitoring (RUM) charts measuring LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS over time.
  - **Primary Value:** Tracking frontend user experience regressions.
  - **Tools:** Vercel Analytics, Google Lighthouse CI, Grafana.

---

## Summary Selection Matrix

| Need / Objective                                   | Recommended Tool Stack                                         |
| :------------------------------------------------- | :------------------------------------------------------------- |
| **Visualize monorepo structure & task order**      | Turborepo (`turbo graph`), `pnpm graph`                        |
| **Clean up spaghetti TS imports & circular paths** | `madge`, `dependency-cruiser`                                  |
| **Inspect database tables & foreign keys**         | Supabase Studio, Drizzle Kit                                   |
| **Analyze heavy Next.js client bundles**           | `@next/bundle-analyzer` (`pnpm --filter portal build:analyze`) |
| **Enforce client bundle size budget limits**       | `.size-limit.json` (350 KB threshold)                          |
| **Trace production backend bottlenecks**           | OpenTelemetry (`@vercel/otel`), Datadog                        |
