# Gemini CLI Context — Arch-System (Plantcor)

This file serves as the canonical instructional context for Gemini CLI interactions within the **Arch-System** monorepo workspace. It details the project's architecture, dependencies, building and running procedures, design constraints, and developer workflows.

---

## 1. Project Overview

**Arch-Systems (Plantcor)** is a high-performance, department-based industrial operations portal for oil & gas / mining field teams. It is architected as a pnpm monorepo optimized for security, caching efficiency, and visual consistency.

### Tech Stack & Core Dependencies

- **Runtime Environment:** Node.js (≥ 22, Volta-pinned to `24.15.0`)
- **Package Manager:** pnpm v9.15.9 (`pnpm-workspace.yaml` managed)
- **Monorepo Engine:** Turborepo & Nx
- **Main Application:** `apps/portal` (Next.js 16 App Router & Turbopack, React 19, TypeScript, Tailwind CSS)
- **Data & Ingestion:** Supabase (Postgres with Row-Level Security), Kysely, Redis (L1/L2 Caching), local-first Docker-hosted services
- **AI Integrations:** LangGraph-based agent state machine, Gemini APIs (`@google/genai`), Ollama fallback, selected via `AI_BACKEND_STRATEGY`
- **Observability:** Sentry (`@sentry/nextjs`) + OpenTelemetry, active when `CI=true` or `ENABLE_HEAVY_PLUGINS=true`

### Monorepo Structure

```text
apps/
  portal/                    # Next.js 16 operations portal (primary product app)
  cms/                       # Payload CMS v3
  overview/                  # Architecture & request flow viewer

packages/
  acl/                       # Role definitions & department slugs (Single Source of Truth)
  contract/                  # Shared Zod validation schemas & OpenAPI schemas
  database/                  # Kysely DB access layer (Type-gen only — never imported in app code)
  supabase/                  # Auth clients (server, client, middleware), SQL migrations & seeds
  redis/                     # Redis clients + L1 (in-memory heap) / L2 (cluster) cache API
  theme/                     # Style Dictionary design tokens, Tailwind presets, custom CSS
  ui/                        # Glassmorphism/shadcn React components (GlassCard, GlassButton, etc.)
  errors/                    # Typed AppError subclasses
  logger/                    # Structured logging utilities
  rate-limiter/              # Token bucket & sliding window rate limiters
  scraper/                   # Crawlee + Gemini web-scraping tool (dev-only)
  utils/                     # Common JavaScript/TypeScript utilities

arch-engine/                 # Rust dev-tooling (rust-utils + rust-wiki-builder) compiles live status
repowiki/                    # Rust-generated system status wiki (Do not edit directly!)
.api/                        # Workspace API surface indices (routes.json, openapi.yaml)
ops/                         # Grafana, Prometheus, & Alertmanager configurations
devops/                      # Production Nginx configs & scripts
```

---

## 2. Building & Running

All commands must be executed using `pnpm` from the monorepo root.

### Development Boot Commands

- **Full Stack Boot:**
  ```bash
  pnpm dev
  ```
  _Launches Redis → Supabase → Next.js portal → Smoke Tests → Monitoring terminals._
- **Quick Boot (Skip Redis):**
  ```bash
  pnpm dev:quick
  ```
- **Portal Only (No Local Infra):**
  ```bash
  pnpm dev:no-infra
  ```
- **Shutdown Environment:**
  ```bash
  pnpm shutdown
  ```

### Build & Compilation

- **Build All Monorepo Packages:**
  ```bash
  pnpm build
  ```
- **Build Portal Only:**
  ```bash
  pnpm --filter portal build
  ```

### Verification & Linting Gates

Before declaring any code change complete, you **must** run the quality gates. Because Turbo caches lint results, always use `--force` or the local scripts to ensure a fresh, non-cached check.

- **Mandatory Quality Check:**
  ```bash
  pnpm quality
  ```
  _Runs linting, type-checking, Jest tests, and next-backend-guard with Turbo cache bypass._
- **13-Check Integration Gates (Comprehensive CI Check):**
  ```bash
  pnpm gates
  ```
  _Runs markdown lint, CSS lint, YAML lint, Knip, drift-score, agents-verify, design-ratchet, theme-shape, import-guards, etc._
- **Format Files:**
  ```bash
  pnpm format
  ```
  _Runs Prettier to format ts, tsx, md, and json._

### Testing Suite

- **Run All Portal Tests:**
  ```bash
  pnpm --filter portal test
  ```
- **Run a Single Portal Test File:**
  ```bash
  pnpm --filter portal test -- path/to/file.test.tsx
  ```
- **E2E Visual Regression Tests (Playwright):**
  ```bash
  pnpm test:e2e
  ```
  _Requires the development server to be running._

---

## 3. Core Development Conventions

### A. Routing & Middleware

- **Auth & ACL at the Edge:** All requests are gated inside `apps/portal/src/proxy.ts` (Next.js 16 edge middleware, succeeding `middleware.ts`). Never duplicate ACL logic inline.
- **Department Subfolders:** Under `apps/portal/src/app/(departments)/[department]/`. Segment routing slugs are strictly defined in `@repo/acl` (SSOT) and checked against employee `accessible_departments`.
  - _Valid Slugs:_ `drilling`, `production`, `access-control`, `engineering`, `control-room`, `safety`, `training`, `satellite-monitoring`, `environment`, `logistics-fleet`, `geology`.
- **Top-Level Non-Department Routes:** `/hub`, `/executive`, `/admin`, `/quickview`, `/offline`.

### B. Caching Strategy

- **React Server Components (RSC):** RSCs are used by default. Keep components server-renderable; place `"use client"` only on interactive leaf components.
- **Inner-Outer Caching Pattern:** Validate auth in an un-cached outer function, then fetch data in an inner cached function using `createAdminClient()` + `cacheTag`. Never read `cookies()` or `headers()` inside `"use cache"` scopes.
- **Redis L1/L2 Cache:** Use `@repo/redis` for data shared across deployment runtimes. L1 (in-memory heap 15s) and L2 (Redis cache) work together. Pair any Next.js `revalidateTag` with a corresponding `cache.invalidateTags` call to synchronize Redis and the local memory caches.

### C. Design System Rules (RULES.md)

The visual interface enforces a strict Glassmorphic layout. Always respect the rules in `docs/design-system/RULES.md`:

- **Glass Schema:** Use canonical `--arch-glass-*` tokens via `.os-shell` (chrome layers) or `GlassCard` (content cards).
- **No Ad-Hoc Glass Filters:** Do **not** use custom `backdrop-blur-*` or raw opacity fills (`bg-white/40`, etc.) on card/panel surfaces.
- **Ambient Animation:** The global ambient background is a single `<RouteBackground />` component wrapping an H.264 video. Do not overlap or add second backgrounds.
- **CSS Editing Constraint:** Edit tokens directly in `packages/theme/src/css/variables.css`. Do **not** execute `generate-tokens.mjs` for plain CSS edits as it strips `--arch*` primitives.

### D. Data Layer, Validation & Errors

- **Supabase Clients:** Server Components must use `getUserSafely()` from `@repo/supabase/server` to prevent unhandled crashes on expired sessions.
- **Kysely Boundary:** `@repo/database` is for Kysely type generation only; it must never be imported in product runtime code. Use `@repo/supabase` for all DB interactions.
- **Zod Contracts:** Declare schema definitions in `@repo/contract` (shared across client and server).
- **Subclassed Errors:** Throw typed error classes from `@repo/errors` (re-exported via `apps/portal/src/lib/errors/error-classes.ts`) rather than generic `Error` instances.

### E. Agent Tracing & Maintenance (MANDATORY)

AI assistants operating in this repository must maintain documentation continuity:

1. **Tracer Logs:** Every modification must log a dated entry into `.agents/AGENT_TRACER.md` (recording agent, purpose, changes made, and hand-off context).
2. **Code Comments:** Complex or structural logic must include explicit comments starting with `// AGENT-TRACE:` or `/* AGENT-TRACE: ... */`.
3. **Knowledge Base Sync:** When altering routes, auth, or schemas, synchronize the `.agents/knowledge/` (repowiki) folder — specifically `portal-auth-and-routing.md` and `ai-orchestration-and-memory.md`.
