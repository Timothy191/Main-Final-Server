# Arch Systems (Plantcor) — Codebase Requirements & Status

> Current as of July 2026. This document reflects the _actual_ state of the codebase — authoritative reference for all agents.

---

## 1. Build System Requirements

| Requirement         | Status                   | Details                                                                 |
| ------------------- | ------------------------ | ----------------------------------------------------------------------- |
| Package manager     | ✅ pnpm 9 only           | Never npm/yarn. Enforced by `@repo/eslint-config`.                      |
| Node.js             | ✅ >= 22 (Volta pin: 24) | `.nvmrc` and `package.json` engines enforce.                            |
| Build orchestration | ✅ Turborepo 2           | `turbo.json` defines pipeline.                                          |
| Monorepo structure  | ✅ pnpm workspaces       | `apps/` (portal, api, ops-gateway) + `packages/` (15+ shared packages). |

## 2. Application Architecture

### Portal (Next.js 16)

| Aspect        | Status                            | Details                                        |
| ------------- | --------------------------------- | ---------------------------------------------- |
| Framework     | ✅ Next.js 16 (App Router)        | Turbopack dev, Cache Components enabled.       |
| Language      | ✅ TypeScript 5.7 strict          | No `any`, no `@ts-ignore`.                     |
| Styling       | ✅ Tailwind CSS 3 + `@repo/theme` | CSS variables, glass effects, liquid variants. |
| UI primitives | ✅ `@repo/ui`                     | Extend before using Radix directly.            |
| Client state  | ✅ Zustand 5                      | Global state only.                             |
| Validation    | ✅ Zod 3                          | All external input validated.                  |

### API (NestJS)

| Aspect               | Status                                               | Details                                                 |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Framework            | ✅ NestJS REST API                                   | Port 3004 (dev), proxied via portal `/api/backend/*`.   |
| Auth                 | ✅ SupabaseAuthGuard                                 | Returns 401 (not 403) for unauthenticated requests.     |
| Service-role defense | ✅ Service-role tokens rejected by SupabaseAuthGuard | Prevents leaked key from impersonating users.           |
| SSRF protection      | ✅ GatewayProxyController validates OPS_GATEWAY_URL  | Rejects loopback, cloud metadata, `.internal`/`.local`. |

## 3. Database (PostgreSQL via Supabase)

### Schema State

| Aspect             | Status                           | Details                                                                             |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------- |
| Migrations         | ✅ 71+ sequential SQL migrations | `packages/database/migrations/` + `packages/supabase/migrations/`.                  |
| Partitioning       | ✅ 4 partitioned tables          | `hourly_loads`, `daily_logs`, `audit_logs`, `memory_embeddings` — monthly RANGE.    |
| Materialized views | ✅ 3 views + smart refresh       | `dept_production_summary`, `machine_utilization_weekly`, `safety_incident_monthly`. |
| Vector search      | ✅ HNSW + optional DiskANN       | `memory_embeddings` with 1536-dim embeddings, adaptive ef_search.                   |
| Full-text search   | ✅ GIN on to_tsvector            | `memory_embeddings.content` FTS index.                                              |

### Index Coverage (verified by `tests/index_full_coverage.sql`)

| Index Type             | Count | Details                                                               |
| ---------------------- | ----- | --------------------------------------------------------------------- |
| GIN                    | 3     | `accessible_departments` (RLS), metadata JSONB, FTS                   |
| BRIN                   | 4     | Time-series date columns on partitioned tables                        |
| B-tree (department_id) | 3     | Denormalized on `machine_hours`, `fuel_logs`, `production_logs`       |
| RLS performance        | 3     | `employees(auth_id)`, `departments(name)`, `employees(department_id)` |
| Dashboard composites   | 13    | Machine hours, fuel logs, breakdowns, safety, hourly loads, etc.      |
| FK column indexes      | 16    | All FK columns have covering indexes                                  |
| Access control         | 8     | Badges, access logs composite/partial indexes                         |
| Materialized view      | 3     | Unique indexes for CONCURRENTLY refresh                               |
| Vector / HNSW          | 3     | Full + filtered (episodic, semantic)                                  |
| Partition indexes      | 7     | On partitioned parent tables, inherited to children                   |

**Known advisory gaps:** 18 FK columns (mostly `created_by`, `department_id`, `daily_log_id` patterns) lack dedicated covering indexes. These are advisory warnings, not hard failures.

### RLS Security

| Aspect                 | Status                                         | Details                                      |
| ---------------------- | ---------------------------------------------- | -------------------------------------------- |
| RLS enabled            | ✅ All operational tables                      | Consistent `has_department_access()` helper. |
| P0 vulnerability fixed | ✅ `WITH CHECK` + `BEFORE UPDATE` trigger      | Migration 057 fixes privilege escalation.    |
| Regression tests       | ✅ `tests/accessible_departments_priv_esc.sql` | Verifies self-elevation blocked.             |
| Denormalized RLS       | ✅ `department_id` on child tables             | Migration 071 eliminates JOIN in policies.   |

## 4. Development Workflow

### Dev Script Modes (`scripts/dev.sh`)

| Mode         | Redis    | Supabase | Portal       | Use Case                            |
| ------------ | -------- | -------- | ------------ | ----------------------------------- |
| `(no flags)` | ✅       | ✅       | ✅           | Full stack development              |
| `--quick`    | ❌       | ✅       | ✅           | DB + frontend only, skip cache      |
| `--no-infra` | ⚠️       | ⚠️       | ✅           | Assume infra already running        |
| `--quality`  | as above | as above | ✅ + quality | Also run `pnpm quality` after smoke |

### Boot Order

1. **Phase 0:** Pre-flight (PID cleanup, port check, AI system check)
2. **Phase 1:** Environment (Node, pnpm, Docker, .env, dependencies)
3. **Phase 2:** Redis (full mode only; quick/no-infra check existing)
4. **Phase 3:** Supabase (full + quick modes; no-infra checks existing)
5. **Phase 4:** Portal (Next.js Turbopack on :3000)
6. **Phase 5:** Stack smoke (auth health, /api/health, login HTML, routing)

### Stack Smoke Tests (Phase 5)

| Test                   | Mode      | Expected                    |
| ---------------------- | --------- | --------------------------- |
| Redis PING             | full only | docker exec PONG            |
| Supabase auth health   | all modes | HTTP 200 on :54321          |
| `/api/health database` | all modes | `status: "healthy"`         |
| Login page HTML        | all modes | HTTP 200 + document markers |
| Route: `/hub`          | all modes | 3xx redirect to /login      |
| Route: `/engineering`  | all modes | 3xx redirect to /login      |

## 5. Authentication & Routing Flow

```
Login (/login)
  └─ If has session cookie → redirect to /hub
  └─ If no session → show login form → POST server action
       └─ On success → redirect to /hub (via server action)

Hub (/hub)
  └─ If no user → redirect to /login
  └─ Shows department cards based on accessible_departments ACL
  └─ Department card links → /<department-slug>

Middleware (proxy.ts)
  └─ Unauthenticated request to protected route → redirect /login?redirect=<path>
  └─ Authenticated to restricted route (control-room, access-control, admin)
       └─ Role check: must have required role (admin, control_room_operator, etc.)
  └─ Authenticated to department route
       └─ UUID resolution → check has_department_access → redirect /hub?error= if denied
```

### Route Structure

| Pattern            | Auth Required | Notes                                                       |
| ------------------ | ------------- | ----------------------------------------------------------- |
| `/login`           | No            | Redirects to `/hub` if already authenticated.               |
| `/hub`             | Yes           | Landing page after login. Shows accessible departments.     |
| `/<department>/`   | Yes           | Department-specific pages. ACL-gated by middleware.         |
| `/admin/`          | Yes           | Admin role required.                                        |
| `/control-room/`   | Yes           | `control_room_operator` or `admin` role required.           |
| `/access-control/` | Yes           | `access_control` or `admin` role required.                  |
| `/api/*`           | Varies        | Portal API routes. Webhook routes use server supabase auth. |
| `/api/backend/*`   | N/A           | Proxy to NestJS API (3004).                                 |

## 6. Quality Gates

| Gate            | Command                               | Enforced                             |
| --------------- | ------------------------------------- | ------------------------------------ |
| Lint            | `pnpm lint`                           | `--max-warnings 0`                   |
| TypeScript      | `pnpm type-check`                     | `tsc --noEmit` strict mode           |
| Tests           | `pnpm test`                           | Jest across all packages (103 tests) |
| Format          | `pnpm format:check`                   | Prettier                             |
| Full quality    | `pnpm quality`                        | All four gates above                 |
| AI system       | `pnpm ai:check`                       | Guardrails, layouts, sync, drift     |
| Index coverage  | `tests/index_full_coverage.sql`       | 64 indexes across 11 categories      |
| Rollback safety | `tests/migration-rollback-safety.mjs` | Validates migration reversibility    |

> **Note:** Portal tests have 17 pre-existing failures (37/350 tests) related to login page rebranding (class name changes). Type-check has 2 pre-existing errors (Inngest/OTel conflict, null-safety). Lint has 2 pre-existing warnings (missing deps in useEffect).

## 7. Key Dependencies

| Service         | Package                                   | Purpose                                         |
| --------------- | ----------------------------------------- | ----------------------------------------------- |
| Database ORM    | `@repo/supabase`, `@repo/database`        | Supabase JS client + Kysely for complex queries |
| Auth            | `@supabase/ssr` + `@repo/auth`            | Cookie-based SSR sessions                       |
| Background jobs | `@repo/utils/inngest` (Inngest 4)         | + `@nestjs/bullmq` for API tasks                |
| Caching         | `@repo/redis` + Next.js `"use cache"`     | Redis L1/L2 cache mesh                          |
| Rate limiting   | `@repo/rate-limiter`                      | Fixed window strategy                           |
| Observability   | OpenTelemetry + Sentry                    | Tracing + error monitoring                      |
| Vector search   | pgvector (HNSW) + pgvectorscale (DiskANN) | AI memory embeddings                            |
| Scheduled tasks | pg_cron                                   | Partition creation, MV refresh, cache cleanup   |

## 8. Scripts & Utilities

| Script                         | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `scripts/dev.sh`               | Development server boot: Redis → Supabase → portal + smoke |
| `scripts/shutdown.sh`          | Stop portal + optionally tear down infra                   |
| `scripts/open-login.sh`        | Open portal login page in browser                          |
| `scripts/validate-env.sh`      | Validate environment variables                             |
| `scripts/ai.sh`                | Unified AI system command (status, init, fix, check)       |
| `scripts/copy-assets.sh`       | Sync root assets/ → portal public/assets/                  |
| `scripts/generate-api-env.mjs` | Generate apps/api/.env from portal env                     |
| `scripts/deploy-production.sh` | Deploy full production stack via Docker Compose            |
| `scripts/backup-db.sh`         | Automated PostgreSQL backup with rotation                  |

## 9. Current Session Changes (July 19, 2026)

| Change                  | File(s)                                      | Description                                                  |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| Migration 071           | `migrations/071_supabase_best_practices.sql` | GIN + BRIN indexes, denormalized RLS, consolidated functions |
| Index coverage test     | `tests/index_full_coverage.sql`              | 64 indexes across 11 categories, 64/64 pass                  |
| Query refactor          | `src/query-builder.ts` + 14 app files        | `SELECT *` → explicit column selections                      |
| AGENT_TRACER cleanup    | 12 AGENT_TRACER.md files                     | Categorized entries, stale init removed                      |
| Rollback safety         | `tests/migration-rollback-safety.mjs`        | Updated for migration 071 patterns                           |
| Dev script --quick mode | `scripts/dev.sh`                             | Now starts Supabase + portal; skips Redis only               |
| Routing smoke tests     | `scripts/dev.sh` Phase 5                     | `/hub` and `/engineering` 3xx redirect verification          |
