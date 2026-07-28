# Workspace & Package Topology Map

## 1. Monorepo Architectural Overview

The **Arch Systems Portal** monorepo is managed via **pnpm workspaces** and **Turborepo 2**, targeting Node.js >= 22 (pinned to Node 24.15.0 via Volta).

```text
                               +----------------------------------+
                               |         Portal UI (App)          |
                               |     apps/portal (Next.js 16)     |
                               +----------------+-----------------+
                                                |
                 +------------------------------+------------------------------+
                 |                              |                              |
                 v                              v                              v
      +--------------------+         +--------------------+         +--------------------+
      |  @repo/contract    |         |  @repo/supabase    |         |    @repo/redis     |
      | (Zod Validation)   |         | (Auth, PostgREST)  |         | (L1/L2 Cache Mesh) |
      +--------------------+         +--------------------+         +--------------------+
                 |                              |                              |
                 +------------------------------+------------------------------+
                                                |
                                                v
                               +----------------------------------+
                               |     Control Plane / Gateway      |
                               |  apps/ops-gateway (MCP Bridge)   |
                               |  apps/api-gateway (GraphQL Mesh) |
                               +----------------------------------+
```

---

## 2. Workspace Applications (`apps/`)

| Application       | Path                | Technology                                                 | Primary Responsibility                                                                                                                               |
| :---------------- | :------------------ | :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`portal`**      | `apps/portal/`      | Next.js 16 (App Router, React 19, Turbopack, Tailwind CSS) | Deployable primary enterprise web UI, 51 REST API route handlers, Server Actions, Inngest background job handler, and SSR/SSG department dashboards. |
| **`ops-gateway`** | `apps/ops-gateway/` | Node.js, TypeScript, MCP Protocol, HTTP                    | Control-plane bridge hosting MCP tools, telemetry subscriber/poller, audit log polling, and incident engine.                                         |
| **`api-gateway`** | `apps/api-gateway/` | GraphQL Mesh, OpenAPI, PostGraphile                        | Unified GraphQL schema mesh synthesizing REST and OpenAPI data sources into a single schema.                                                         |

---

## 3. Package Topology (`packages/` — 14 `@repo/*` Packages)

The monorepo contains exactly **14 `@repo/*` shared packages**. Each package is framework-agnostic or domain-isolated:

```text
packages/
├── contract/            --> @repo/contract (Zod Schemas & OpenAPI generator)
├── database/            --> @repo/database (Kysely DB Client & Migrations)
├── departments/         --> @repo/departments (Department UI components & routes)
├── errors/              --> @repo/errors (AppError hierarchy & status codes)
├── eslint-config/       --> @repo/eslint-config (Shared ESLint rule presets)
├── llm-config/          --> @repo/llm-config (OpenAI / Anthropic LLM configs)
├── logger/              --> @repo/logger (Structured JSON server/client logger)
├── rate-limiter/        --> @repo/rate-limiter (Token Bucket & Sliding Window)
├── redis/               --> @repo/redis (Hybrid L1 RAM + L2 Redis cache mesh)
├── supabase/            --> @repo/supabase (Auth, Server/Admin client, RLS helpers)
├── theme/               --> @repo/theme (Design tokens, glassmorphism palette)
├── typescript-config/   --> @repo/typescript-config (Strict tsconfig bases)
├── ui/                  --> @repo/ui (Shared primitives, GlassCard, UI components)
└── utils/               --> @repo/utils (Shared utilities & Inngest client)
```

### Detailed Package Index

| Package                 | Package Name              | Key Exports                                                                                                                                             | Primary Responsibilities                                                                      |
| :---------------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| **`contract`**          | `@repo/contract`          | `updateWebhookSchema`, `auditQuerySchema`, `openapi.generated.json`                                                                                     | Zod validation schemas for cross-boundary REST payloads and OpenAPI documentation generation. |
| **`database`**          | `@repo/database`          | `db`, `Kysely`, migration runner scripts                                                                                                                | Type-safe SQL query builder via Kysely and schema migration tools.                            |
| **`departments`**       | `@repo/departments`       | Department UI components (`/ui`), route maps                                                                                                            | Modular department-specific layout wrappers and component views.                              |
| **`errors`**            | `@repo/errors`            | `AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `InternalError`, `ConflictError`, `RateLimitError`, `isAppError` | Standardized application error hierarchy and HTTP response serialization.                     |
| **`eslint-config`**     | `@repo/eslint-config`     | Shared ESLint configurations                                                                                                                            | Code style enforcement and linting rules.                                                     |
| **`llm-config`**        | `@repo/llm-config`        | Prompt templates, model identifiers                                                                                                                     | AI/LLM model parameters and routing configurations.                                           |
| **`logger`**            | `@repo/logger`            | `serverLogger`, `clientLogger`, `Logger`                                                                                                                | High-performance structured JSON logging for server and browser contexts.                     |
| **`rate-limiter`**      | `@repo/rate-limiter`      | `TokenBucket`, `SlidingWindow`                                                                                                                          | Rate limiting algorithm implementations for API protection.                                   |
| **`redis`**             | `@repo/redis`             | `Cache` class, `cache` singleton, `cacheWrap`, `cacheGet`, `cacheSet`                                                                                   | Hybrid L1 (in-memory LRU) + L2 (Redis cluster) multi-tier caching library.                    |
| **`supabase`**          | `@repo/supabase`          | `createServerSupabaseClient`, `createAdminClient`, RLS helpers                                                                                          | Supabase client initialization (Session-scoped vs Service Role).                              |
| **`theme`**             | `@repo/theme`             | Tailwind tokens, semi-transparent white glass palette                                                                                                   | Design system design tokens, glassmorphism translucency (`rgba(255,255,255,0.72)`).           |
| **`typescript-config`** | `@repo/typescript-config` | Base `tsconfig.json` files                                                                                                                              | Strict TypeScript configurations (`nextjs.json`, `base.json`).                                |
| **`ui`**                | `@repo/ui`                | `GlassCard`, `Button`, UI primitive components                                                                                                          | Framework component library adhering to semi-transparent glass aesthetic.                     |
| **`utils`**             | `@repo/utils`             | `inngest` client, `cn()`, string & array formatters                                                                                                     | Monorepo shared utility functions and background job client instance.                         |

---

## 4. Architectural Boundary Rules

1. **Strict Upward Isolation**: Packages in `packages/` **must never** import from `apps/`.
2. **Framework Decoupling**: Core logic in `@repo/errors`, `@repo/contract`, `@repo/rate-limiter`, and `@repo/redis` remains framework-agnostic.
3. **Admin Client Boundary**: `createAdminClient()` (Service Role) is restricted to server-side cached routines, background tasks, or authorized API handlers.
