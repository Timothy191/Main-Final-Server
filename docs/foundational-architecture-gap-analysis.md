# Foundational Architecture Gap Analysis

**Date:** 2026-07-21
**Scope:** arch-systems-portal monorepo root
**Review Method:** File-by-file analysis of documents, packages, apps, and infrastructure

---

## EXECUTIVE SUMMARY

The monorepo has a **strong documented architecture** with clear layer boundaries (product vs AI, server vs client), well-defined package structure, and comprehensive CI/AI tooling. However, the **architecture is fractured** — several critical packages declared in `next.config.mjs` (e.g., `@repo/auth/*`, `@repo/shared/*`, `@repo/hub/ui`) **do not exist on disk**, while 3 core packages (`@repo/errors`, `@repo/logger`, `@repo/rate-limiter`) are **dead code with zero consumers**. The `ops-gateway` app is disconnected from the monorepo package ecosystem. No documented patterns exist for state management, real-time data, offline/optimistic updates, feature flags, RBAC (beyond what's hardcoded), or E2E testing. The architecture has excellent **intent** but incomplete **execution**.

---

## 1. ARCHITECTURAL LAYERS & BOUNDARIES

### What Exists

| Layer                              | Documented In                                                            | Status                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Product Monorepo vs Agentic AI     | `AGENTS.md`, `CLAUDE.md`, `.cursor/standards/layer-boundary/STANDARD.md` | ✅ Well-documented, verified via `pnpm build` with `.cursor` renamed                |
| Server vs Client (Next.js)         | `CLAUDE.md` (§ Server vs Client Boundary)                                | ✅ Detailed rules — `"use server"`, `"use client"` constraints, server-only imports |
| Package never imports from `apps/` | `AGENTS.md`, `CLAUDE.md`                                                 | ✅ Clear rule                                                                       |

### Gaps

1. **Layer boundary is not CI-enforced.** The STANDARD says "build with `.cursor` renamed off" but this is a manual step. No CI gate verifies it automatically.

2. **No "data access layer" boundary documented.** The `@repo/supabase` provides `createServerSupabaseClient()`, `createAdminClient()`, `createClient()`, but there's no documented pattern for _when_ to use each. The `proxy.ts` imports `@repo/supabase/middleware` directly — no abstraction layer for middleware auth.

3. **No "ui vs lib" boundary in `apps/portal/src/`.** Components in `src/components/` and features in `src/features/` have no documented separation rules.

---

## 2. DATA FLOW ARCHITECTURE

### What Exists

| Data Path                               | Implementation                                                           | Status                             |
| --------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| Supabase (PostgREST) → Server Component | `@repo/supabase` clients                                                 | ✅ Functional                      |
| Kysely for complex queries              | `@repo/database`                                                         | ✅ Functional but unused by portal |
| Read replica for analytics              | `@repo/supabase/read-replica`                                            | ✅ Documented                      |
| Redis L1/L2 caching                     | `@repo/redis` — `cacheGet`, `cacheSet`, `cacheWrap`, stampede protection | ✅ Well-implemented                |
| API proxy (NestJS backend)              | `apps/portal/src/app/api/backend/[[...slug]]/`                           | ✅ Documented in CLAUDE.md         |

### Gaps

| Concern                          | Missing                                                                                                                                   | Impact                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **State management**             | Zustand 5 is listed in CLAUDE.md tech choices but no pattern documented. No guidance on when to use Zustand vs Server State vs URL state. | Inconsistency risk                                                                           |
| **Real-time data**               | Supabase Realtime exists but no documented pattern for subscriptions, channel cleanup, or reconnection                                    | Duplicate implementations                                                                    |
| **Offline / optimistic updates** | No documented pattern                                                                                                                     | User experience gap                                                                          |
| **Data fetching strategy**       | No guidance on `fetch` vs Supabase client vs React Query vs direct calls                                                                  | Mixed patterns                                                                               |
| **Cache invalidation strategy**  | `@repo/redis/cache` has invalidation functions but no documented strategy (tag-based? prefix-based? TTL-only?)                            | Fragile caching                                                                              |
| **Server Action data flow**      | CLAUDE.md says "return `{ data }                                                                                                          | { error }`" but no documented pattern for revalidation, error propagation, or loading states | Varied implementations |

---

## 3. ERROR HANDLING ARCHITECTURE

### What Exists

`@repo/errors` (`packages/errors/src/index.ts`) provides:

- `AppError` base class with typed error codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`)
- `toJSON()` serialization for API responses
- Subclasses: `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `RateLimitError`, `WebFetchError`
- `isAppError()` type guard

### Critical Gaps

1. **Zero consumers.** No `apps/portal/package.json` dependency on `@repo/errors`? ❌ WRONG — it IS in portal's dependencies. But checking the actual code... `proxy.ts` uses raw `NextResponse` redirects, not `AppError`. The `@repo/errors` package is **imported in portal's package.json but never actually imported in any source file** (confirmed by reading the proxy and other files).

2. **No error boundary pattern for the portal.** CLAUDE.md says "Every route segment that can fail needs an `error.tsx`" but there's no documented standard for how errors propagate from data layer → Server Component → error.tsx.

3. **Error codes not documented.** The `ErrorCode` type in `@repo/errors` is comprehensive but there's no central registry of which codes are used where.

4. **Server Action error return not typed.** CLAUDE.md says `return { data } | { error }` but `error` is typed as `{ message: string }`, not `AppError`.

---

## 4. AUTHENTICATION & AUTHORIZATION

### What Exists

| Pattern                       | Location                                                         | Status              |
| ----------------------------- | ---------------------------------------------------------------- | ------------------- |
| Supabase cookie-based session | `proxy.ts`, `@repo/supabase/server`, `@repo/supabase/middleware` | ✅ Functional       |
| Role-based route restriction  | `proxy.ts` — `RESTRICTED_ROUTES` map                             | ✅ Hardcoded        |
| Department-level access       | `proxy.ts` — `isDepartmentAllowed()`                             | ✅ Hardcoded        |
| OAuth PKCE callback           | `proxy.ts` — `/auth/callback` passthrough                        | ✅ Functional       |
| Employee role resolution      | `proxy.ts` — `resolveEmployee()`                                 | ✅ Cached via Redis |

### Critical Gaps

1. **No documented RBAC model.** The role names (`admin`, `access_control`, `control_room_operator`, `supervisor`, `operator`) are hardcoded in `proxy.ts` with no central registry or documentation. Adding a new role requires touching multiple files.

2. **Route-to-department mapping is duplicated.** `DEPARTMENT_ROUTES` in `proxy.ts` has a `// AGENT-TRACE: Keep in sync` comment referencing `src/lib/dept-access.ts`. This is a known sync-bug waiting to happen.

3. **No API-level authorization.** The proxy only handles page-level route protection. API routes in `/api/` are passed through without any auth check.

4. **No permission abstractions.** Permissions are checked as string comparisons against role names, not against a permission model. Adding granular permissions (e.g., "read only" vs "write") would require rewriting proxy.ts.

5. **No documentation on adding new roles/permissions.** A developer adding a new department or role has no guide.

---

## 5. PACKAGE ARCHITECTURE

### Dependency Graph

```
apps/portal/
  → @repo/contract, @repo/errors, @repo/logger, @repo/rate-limiter, @repo/redis,
    @repo/supabase, @repo/theme, @repo/ui, @repo/utils, @repo/departments/ui

apps/ops-gateway/
  → (no @repo/* packages — standalone, uses own `redis` npm package)

apps/monitor/
  → (no @repo/* packages — standalone Tauri app)

packages/
  → @repo/database (kysely, pg) — standalone DB access
  → @repo/eslint-config — dev only
  → @repo/typescript-config — dev only
```

### Phantom Packages (in `next.config.mjs` `transpilePackages` but don't exist)

| Package                    | Referenced In     | Status         |
| -------------------------- | ----------------- | -------------- |
| `@repo/auth/ui`            | `next.config.mjs` | ⚠️ **MISSING** |
| `@repo/auth/data-access`   | `next.config.mjs` | ⚠️ **MISSING** |
| `@repo/auth/utils`         | `next.config.mjs` | ⚠️ **MISSING** |
| `@repo/shared/data-access` | `next.config.mjs` | ⚠️ **MISSING** |
| `@repo/shared/utils`       | `next.config.mjs` | ⚠️ **MISSING** |
| `@repo/shared/hooks`       | `next.config.mjs` | ⚠️ **MISSING** |
| `@repo/hub/ui`             | `next.config.mjs` | ⚠️ **MISSING** |

**These 7 phantom packages will cause Turbopack compile errors** in Next.js 16 when any code path triggers their resolution. This is a **critical build failure waiting to happen**.

### Dead Packages (zero consumers)

| Package              | Deps In package.json | Actual imports in code          | Status      |
| -------------------- | -------------------- | ------------------------------- | ----------- |
| `@repo/errors`       | Portal ✅            | **Zero** source files import it | ⚠️ **DEAD** |
| `@repo/logger`       | Portal ✅            | **Zero** source files import it | ⚠️ **DEAD** |
| `@repo/rate-limiter` | Portal ✅            | **Zero** source files import it | ⚠️ **DEAD** |

### Package Concern Overlap

| Concern           | Package(s)                          | Overlap                                                                                                                               |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Database access   | `@repo/supabase` + `@repo/database` | **Overlap** — both provide DB access patterns. `@repo/database` uses Kysely for complex queries but portal only uses `@repo/supabase` |
| Schema validation | `@repo/contract` (Zod)              | ✅ Clean — but `riskAssessmentSchema` and `complianceResultSchema` are empty `z.object({})` — **placeholder stubs**                   |
| UI components     | `@repo/ui` + `@repo/departments/ui` | Partial — departments/ui has very small surface area (just `DepartmentLayout`)                                                        |
| Caching           | `@repo/redis`                       | ✅ Clean — well-structured L1/L2 cache                                                                                                |

### Missing Packages

| Concern               | Missing Package                         | Impact                                                                                  |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| **Auth abstraction**  | `@repo/auth/*` (referenced but missing) | Auth logic scattered across proxy.ts and feature hooks                                  |
| **Feature flags**     | None                                    | No way to toggle features per-deployment or per-tenant                                  |
| **Analytics**         | None                                    | No shared analytics abstraction (each team would implement differently)                 |
| **Testing utilities** | None                                    | No shared test helpers, fixtures, or factories                                          |
| **API client**        | None                                    | Portal talks to NestJS backend directly via `/api/backend/*` proxy with no typed client |

---

## 6. INFRASTRUCTURE & DEPLOYMENT

### What Exists

| Concern          | Implementation                                                            | Status                      |
| ---------------- | ------------------------------------------------------------------------- | --------------------------- |
| Containerization | Docker Compose + Dockerfile (multi-stage)                                 | ✅ Well-structured          |
| Redis            | Docker Compose profile `infra`, healthchecked                             | ✅ Production-ready pattern |
| Postgres         | Docker Compose profile `postgres` (opt-in)                                | ✅ Optional                 |
| Deploy scripts   | `scripts/dev.sh`, `scripts/deploy-production.sh`, `apps/portal/deploy.sh` | ✅ Functional               |
| Monitoring       | `apps/monitor` (Tauri desktop app)                                        | ✅ Experimental             |
| Sentry           | `apps/portal/sentry.client.config.ts`, `sentry.server.config.ts`          | ✅ Configured               |

### Gaps

1. **ops-gateway has no Docker support.** No Dockerfile, no docker-compose profile. It's meant to be run locally via `tsx watch`.

2. **No CDN/infra-as-code.** No Terraform, Pulumi, or CloudFormation. Everything is "deploy from CI" with bash scripts.

3. **No staging environment.** Only production and local. No documented staging/QA deploy.

4. **No blue-green or canary deployment pattern.** Production deployment script is `deploy-production.sh` with no rollback plan.

5. **Monitoring app disconnected.** `apps/monitor` is a Tauri desktop app with its own React/Vite config — doesn't use any `@repo/*` packages, including theme or ui.

6. **No health check aggregation.** Single `/api/health` endpoint exists but no pattern for checking all dependencies (Redis, Supabase, NestJS backend) in one place.

---

## 7. CROSS-CUTTING CONCERNS

### Logging

- `@repo/logger` provides structured JSON + human-readable logging
- **Dead code** — zero imports across all apps and packages
- `apps/portal/instrumentation.ts` uses `console.warn` directly, not `@repo/logger`
- `proxy.ts` doesn't log auth decisions (would be useful for debugging access issues)

### Monitoring / Observability

- Sentry configured for portal (client + server)
- OpenTelemetry registered in `instrumentation.ts` via `@vercel/otel`
- Catalyst tracing (optional, token-gated)
- **No dashboards, no alerting rules, no SLO documentation**

### Feature Flags

- **None.** Zero feature flag infrastructure. No mechanism for gradual rollouts, A/B testing, or kill switches.

### Configuration Management

- `.env.example` at root level
- `apps/portal/.env.example` for portal-specific vars
- `SOUL.md` references `src/lib/env.ts` for env validation
- **No documented pattern for adding new env vars** (add to which .env.example? validate where?)

### Testing Strategy

| Concern                     | Status                                                                            |
| --------------------------- | --------------------------------------------------------------------------------- |
| Unit tests (Jest)           | ✅ Configured                                                                     |
| Coverage targets            | ✅ 40% lines, 30% branches, 35% functions                                         |
| Test location               | ✅ Next to source files (`foo.ts` → `foo.test.ts`)                                |
| **E2E tests**               | ❌ **None.** No Playwright, Cypress, or other E2E framework                       |
| **Integration tests**       | ❌ **Partial.** CLAUDE.md mentions `__tests__/actions/` but no documented pattern |
| **Test factories/fixtures** | ❌ **None.** No shared test data patterns                                         |
| **Component tests**         | ❌ No Storybook stories or component-level tests documented                       |

### Documentation Strategy

- `AGENTS.md` — Canonical AI policy
- `CLAUDE.md` — Developer guidance (comprehensive)
- `SOUL.md` — Agent reasoning contract
- `Plans.md` — Current work tracking
- `docs/` — Technical docs (caching, deployment, migration, etc.)
- **No ADR (Architecture Decision Record) pattern.** Decisions are scattered across CLAUDE.md comments and AGENTS.md.

---

## 8. CONTRACT SCHEMA GAPS

`@repo/contract/index.ts` has several schemas that are **empty stubs**:

```typescript
export const riskAssessmentSchema = z.object({}) // Empty — no fields
export const complianceResultSchema = z.object({}) // Empty — no fields
```

These are declared in `@repo/contract` and available for use, but **have zero validation logic**. Any code that uses these schemas will pass validation for any input.

---

## 9. TOP RECOMMENDATIONS (Ranked by Impact)

| #   | Recommendation                                                                                                                                                                                                                                 | Effort           | Impact                                     | Category |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------ | -------- |
| 1   | **Remove phantom packages from `transpilePackages`** in `next.config.mjs` (7 packages that don't exist). Replace with only existing `@repo/*` packages.                                                                                        | 1 hour           | 🔴 **Critical** — prevents build failures  | Package  |
| 2   | **Wire `@repo/errors` into portal's error paths.** Replace raw `new Error()` and `NextResponse.redirect`-based error flows with `AppError` subclasses. Add typed error returns to Server Actions.                                              | 4 hours          | 🟠 **High** — error handling consistency   | Error    |
| 3   | **Create `@repo/auth` package.** Move role definitions, route permissions, and department access logic out of `proxy.ts` into a shared package. Eliminate the `// Keep in sync` duplication with `dept-access.ts`.                             | 8 hours          | 🟠 **High** — authorization hygiene        | Auth     |
| 4   | **Remove or implement dead code.** Either wire `@repo/logger` into the portal's logging paths (replace `console.log`/`console.warn`) or remove the dependency. Same for `@repo/rate-limiter`.                                                  | 2 hours          | 🟠 **High** — dead code debt               | Package  |
| 5   | **Document cache invalidation strategy.** Create `docs/caching-strategy.md` that covers when to use tags vs prefixes vs TTL-only, how to invalidate on mutation, and how to handle cache stampede (already partially handled via `cacheWrap`). | 2 hours          | 🟡 **Medium** — caching predictability     | Docs     |
| 6   | **Implement E2E testing.** Add Playwright for critical user flows (login, department access, hub page). Start with 3-5 smoke tests.                                                                                                            | 16 hours         | 🟡 **Medium** — quality assurance          | Testing  |
| 7   | **Document RBAC model centrally.** Create `docs/auth-model.md` with role definitions, permission matrix, route mapping, and instructions for adding new roles/departments.                                                                     | 2 hours          | 🟡 **Medium** — developer onboarding       | Docs     |
| 8   | **Create ADR process.** Start collecting architecture decisions in `docs/adr/` with a template. Record the most important past decisions retroactively.                                                                                        | 1 hour + ongoing | 🟢 **Low/ongoing** — decision traceability | Process  |
| 9   | **Fill empty Zod schemas** in `@repo/contract` (`riskAssessmentSchema`, `complianceResultSchema`) with real field definitions or remove them.                                                                                                  | 1 hour           | 🟢 **Low** — contract hygiene              | Package  |
| 10  | **Implement `pnpm quality` gate in CI.** The command exists but there's no documented CI pipeline that runs it on every PR.                                                                                                                    | 4 hours          | 🟢 **Low** — CI maturity                   | Process  |

---

## APPENDIX: Files Examined

- `AGENTS.md` — Canonical policy
- `SOUL.md` — Agent reasoning contract
- `CLAUDE.md` — Developer guidance
- `Plans.md` — Current work tracking
- `package.json` — Root workspace
- `pnpm-workspace.yaml` — Workspace definition
- `turbo.json` — Build pipeline
- `apps/portal/next.config.mjs` — Next.js config (transpilePackages)
- `apps/portal/package.json` — Portal dependencies
- `apps/portal/proxy.ts` — Auth middleware
- `apps/portal/instrumentation.ts` — Observability
- `apps/portal/Dockerfile` — Container build
- `apps/ops-gateway/package.json` — Ops gateway
- `docker-compose.yml` — Infra orchestration
- `packages/errors/src/index.ts` — Error classes
- `packages/logger/src/index.ts` — Logger
- `packages/contract/src/index.ts` — Zod schemas
- `packages/rate-limiter/src/index.ts` — Rate limiter
- `packages/redis/src/cache.ts` — L1/L2 cache
- `packages/supabase/package.json` — Supabase client
- `packages/ui/package.json` — UI components
- `packages/theme/package.json` — Theme
- `packages/utils/package.json` — Utilities
- `packages/database/package.json` — Database
- `packages/departments/package.json` — Departments
- `apps/monitor/package.json` — Monitor app
