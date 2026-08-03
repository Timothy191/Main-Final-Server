# 🏗️ Arch-System — Professional Code Review

## Score-Based Assessment

**Overall Score: 7.2 / 10** — A well-architected monorepo with strong fundamentals, thoughtful security, and excellent documentation, held back by type safety gaps, code duplication, test coverage holes, and deployment divergence.

---

## Scoring Breakdown

| #   | Category                          | Score   | Weight   | Weighted       |
| --- | --------------------------------- | ------- | -------- | -------------- |
| 1   | Architecture & Monorepo Structure | **8.5** | 12%      | 1.02           |
| 2   | Type Safety & Code Quality        | **5.5** | 12%      | 0.66           |
| 3   | Security & Auth                   | **8.5** | 12%      | 1.02           |
| 4   | API Design & Backend              | **7.0** | 10%      | 0.70           |
| 5   | UI/UX & Frontend                  | **7.5** | 10%      | 0.75           |
| 6   | Testing & QA                      | **5.5** | 10%      | 0.55           |
| 7   | Performance & Optimization        | **8.0** | 8%       | 0.64           |
| 8   | Observability & Monitoring        | **8.0** | 8%       | 0.64           |
| 9   | Documentation                     | **9.0** | 8%       | 0.72           |
| 10  | DevOps & Deployment               | **6.5** | 5%       | 0.33           |
| 11  | Error Handling & Resilience       | **7.5** | 3%       | 0.23           |
| 12  | Dependency Management             | **7.5** | 2%       | 0.15           |
|     | **Total**                         |         | **100%** | **7.41 → 7.2** |

---

## 1. Architecture & Monorepo Structure — 8.5/10

### Strengths

- **Excellent monorepo organization**: pnpm workspaces + Turborepo with clear separation between `apps/` (product layer) and `packages/` (shared libraries). The `pnpm-workspace.yaml` correctly includes `packages/departments/*` as a nested workspace.
- **Well-designed package boundaries**: `@repo/supabase` (data access), `@repo/database` (SQL migrations), `@repo/redis` (caching), `@repo/rate-limiter`, `@repo/errors`, `@repo/contract` (Zod schemas), `@repo/ui`, `@repo/theme` — each has a single, clear responsibility.
- **Next.js 16 App Router** with proper route groups: `(auth)`, `(departments)`, `@modal` (parallel routes), intercepting routes (`(.)quickview`). This is modern, idiomatic Next.js.
- **Server/client boundary enforcement**: `@repo/supabase/server.ts` uses `import 'server-only'` to prevent client bundle leakage. Server Actions in `actions.ts` use `'use server'` directive.
- **Feature-based organization** under `src/features/` (hub, monitoring, analytics, admin, access-control, auth, departments) — good separation of concerns.
- **Turborepo pipeline** is well-configured with proper `dependsOn` chains (`^build`, `^lint`), caching, and environment variable tracking via `globalEnv`.
- **API middleware layer** (`lib/api/`) with clear separation: `auth.ts` (requireAuth/requireRole/requireAdmin), `rate-limit-middleware.ts`, `ssrf-guard.ts`, `csrf-guard.ts`, `body-limit.ts`, `cors.ts`, `response.ts`, `api-guard.ts`.
- **`@repo/theme` has a proper Style Dictionary token generation pipeline** with `sd.config.mjs`, `generate-tokens.mjs`, `validate-tokens.mjs`, CSS files (glass, animations, cards, focus, palette, reset, transitions), React components (theme-provider, theme-toggle), Tailwind preset, token tests (`palette.test.ts`), and `.stylelintrc.mjs` for CSS linting. This is a professional, well-tooled design system.
- **`@repo/eslint-config`** has sophisticated rules preventing static imports of `@repo/supabase/server` in action files (requires dynamic `await import()` instead) to prevent Turbopack "module factory not available" errors.
- **`lint-staged.config.mjs`** includes markdownlint for `.agents/knowledge/**/*.md` files — ensures documentation quality in the shared knowledge base.

### Issues

- **README is stale/inconsistent**: Claims to be a "pnpm + Nx monorepo" but uses Turborepo, not Nx. Lists `apps/cms` and `apps/overview` that don't exist in the codebase. References `@repo/redis`, `@repo/eval`, and an `orchestrator.md` that aren't present. The README has a stray `# asd` at the end.
- **`packages/database` uses SQLite** (`better-sqlite3` + `Kysely SqliteDialect`) but the README and docker-compose reference PostgreSQL. The `database.types.ts` and `query-builder.ts` exist but the actual DB dialect doesn't match the production stack (Supabase = PostgreSQL). This is a significant architectural mismatch.
- **`@repo/logger` package** is a proper structured logging utility with JSON format in production and human-readable in dev. However, its `withLogging()` HOC is a no-op stub (`return handler`) — functionality is advertised but not implemented.
- **`@repo/departments/ui`** is a STUB package — just `export type {}` with a comment saying "Stub: actual department components will be added here". A workspace package that's essentially empty.
- **`@repo/utils`** has a no-op analytics stub (`analytics.track()` only logs in dev when `DEBUG_ANALYTICS=1`) — another advertised-but-not-implemented pattern.
- **`packages/rust-bindings/`** is referenced in `lint-staged.config.mjs` but not visible in the file listing — may be a deleted or excluded directory that should be cleaned up.

### Recommendations & Solutions

#### 1. Fix the README

**Problem**: README references non-existent apps (`apps/cms`, `apps/overview`), wrong tooling (Nx vs Turborepo), and non-existent packages (`@repo/eval`, `orchestrator.md`).

**Solution**: Rewrite `README.md` to accurately reflect the current state:

- Change "pnpm + Nx monorepo" to "pnpm + Turborepo monorepo"
- Remove `apps/cms` and `apps/overview` from the apps table
- Remove `@repo/eval` and `orchestrator.md` references
- Remove the stray `# asd` at the end
- Add `@repo/logger` to the packages table
- Update the GitHub Actions badge URLs to match the correct repository

#### 2. Reconcile the database package

**Problem**: `packages/database/src/index.ts` uses `SqliteDialect` with `better-sqlite3`, but production uses Supabase (PostgreSQL).

**Solution**: Either:

- **Option A (Recommended)**: Change to `PostgresDialect` to match production:
  ```ts
  import { Kysely, PostgresDialect } from 'kysely'
  import { Pool } from 'pg'

  export const db = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'arch_dev',
      }),
    }),
  })
  ```
- **Option B**: Keep SQLite for local dev/testing but clearly document it and add a production PostgreSQL dialect that's selected based on `NODE_ENV`.

#### 3. Audit `@repo/logger`

**Problem**: `@repo/logger` package structure is unclear.

**Solution**: Verify the package has proper exports (`serverLogger()`, structured logging, log levels). If empty, implement it or document why it exists as a pass-through.

---

## 2. Type Safety & Code Quality — 5.5/10

### Strengths

- **Strict TypeScript config** at root (`"strict": true`, `target: "ES2022"`, `moduleResolution: "Bundler"`).
- **Zod-powered env validation** (`lib/env.ts`) with production safety constraints (rejects localhost Supabase URLs and dummy keys in production).
- **Contract package** uses Zod schemas for API input validation (`createWebhookSchema`, `telemetryPushSchema`, `syncPlaybackSchema`, `exportQuerySchema`).
- **`noUncheckedIndexedAccess: true`** in `@repo/typescript-config/base.json` — this is a positive finding that enforces null checks on array/object index access.
- **ESLint config** (`@repo/eslint-config/next.js`) has sophisticated rules:
  - `@typescript-eslint/no-explicit-any` set to 'warn' (should be 'error')
  - `@typescript-eslint/no-unused-vars` with proper ignore patterns (`^_` prefix)
  - Restricts static imports of `@repo/supabase/server` in action files to prevent Turbopack "module factory not available" errors
  - Requires dynamic `await import()` instead

### Issues

- **Pervasive `any` types in `@repo/supabase`**: The legacy type exports are all `any`:
  ```ts
  /** @deprecated Use typed row from @repo/database */
  export type PersonnelRow = any
  export type BadgesRow = any
  export type IssuedCardsRow = any
  export type PersonnelDetail = any
  export type ExpiringCard = any
  export type Department = any
  ```
  These are marked `@deprecated` but are still exported and likely consumed. This is a **critical type safety hole**.
- **`@repo/redis` uses `any` extensively**: `export function getRedis(): any` and `export const redis = new Proxy({} as any, ...)`. The Proxy pattern is clever for lazy delegation but completely bypasses type checking.
- **`proxy.ts` has untyped Supabase queries**: `resolveEmployee` casts `data as EmployeeAuth` without runtime validation. `resolveDeptUuid` queries `departments` without typed returns.
- **`departments.ts` has hardcoded mock data**: `DEPARTMENTS` array contains hardcoded stats like `{ label: 'Depth', value: '1,240m' }` and `trend: [1180, 1195, 1205, ...]` — these are static strings/numbers in a production file, not fetched from any data source.
- **`getDepartmentTabs()` uses if-chain** instead of a lookup map — 9 sequential `if` statements when a `Record<string, Tab[]>` would be cleaner and more maintainable.
- **`noUnusedLocals: false` and `noUnusedParameters: false`** in root tsconfig — these should be `true` for stricter code quality.
- **Duplicate error class hierarchies**: TWO different `AppError` implementations exist:
  - `@repo/errors` (`packages/errors/src/index.ts`): `AppError` with `code`, `status`, `meta` properties
  - `apps/portal/src/lib/errors/error-classes.ts`: `AppError` with `code`, `statusCode`, `context` properties

  The portal's version has a comment: "Simple error classes to replace @repo/errors package" — this is a known divergence with different APIs, creating confusion about which to use.

- **Duplicate rate limiter code**: `apps/portal/src/lib/api/rate-limit-middleware.ts` re-implements `MemoryStore`, `RedisStore`, `TokenBucketStrategy`, and `SlidingWindowStrategy` that already exist in `@repo/rate-limiter` (`packages/rate-limiter/src/index.ts`). This is significant code duplication with potential for divergence.
- **`api-guard.ts` uses hardcoded config**: `{ windowMs: 60000, maxRequests: 100 }` and identifier `'api-guard-id'` — all routes using `runApiGuards` share the same rate limit bucket, which is likely not intended.
- **`observability/metrics.ts` has stub implementations**: `incrementMetric` and `recordMetric` are empty stubs — functionality is advertised but not implemented.

### Recommendations & Solutions

#### 1. Eliminate `any` types in `@repo/supabase`

**Problem**: Legacy type exports are all `any`, bypassing type safety.

**Solution**: Generate proper types from the Supabase schema using `supabase gen types` and replace the `any` types:

```ts
// Instead of: export type PersonnelRow = any
// Use generated types:
export type PersonnelRow = Database['public']['Tables']['personnel']['Row']
export type BadgesRow = Database['public']['Tables']['badges']['Row']
export type IssuedCardsRow = Database['public']['Tables']['issued_cards']['Row']
// etc.
```

Then remove the `@deprecated` tags since the types are now proper.

#### 2. Type the Redis client

**Problem**: `getRedis(): any` and `redis = new Proxy({} as any, ...)` bypass all type checking.

**Solution**: Create a proper interface for the Redis client:

```ts
export interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<unknown>
  sadd(key: string, member: string): Promise<unknown>
  smembers(key: string): Promise<string[]>
  mget(keys: string[]): Promise<Array<string | null>>
  publish(channel: string, message: string): Promise<unknown>
  // ... etc
}

export function getRedis(): RedisClient | null {
  return getNativeRedisClient()
}
```

#### 3. Consolidate error classes

**Problem**: Two competing `AppError` hierarchies with different APIs.

**Solution**: Pick `@repo/errors` as the canonical package and:

1. Promote portal-specific errors (`AIProviderError`, `ExternalServiceError`, `DatabaseError`) to `@repo/errors`
2. Align the API — standardize on `status` (not `statusCode`) and `meta` (not `context`), or vice versa
3. Add `Error.captureStackTrace` to `@repo/errors` (currently only in portal version)
4. Deprecate `apps/portal/src/lib/errors/error-classes.ts` and re-export from `@repo/errors`
5. Update all imports across the portal to use `@repo/errors`

#### 4. Consolidate rate limiter code

**Problem**: `rate-limit-middleware.ts` duplicates classes from `@repo/rate-limiter`.

**Solution**:

1. Import `MemoryStore`, `RedisStore`, `TokenBucketStrategy`, `SlidingWindowStrategy` from `@repo/rate-limiter` instead of re-implementing them
2. Keep portal-specific features (IP whitelist, load-adaptive throttling, `timingSafeEqual` for internal secrets) as wrappers around the package
3. Example:

```ts
import {
  RateLimiter,
  RedisStore,
  SlidingWindowStrategy,
  TokenBucketStrategy,
} from '@repo/rate-limiter'
// Use the package classes, add portal-specific logic as wrappers
```

#### 5. Replace hardcoded department stats

**Problem**: `DEPARTMENTS` array has static mock data.

**Solution**: Either:

- **Option A**: Fetch real stats from Supabase in a Server Component and pass as props
- **Option B**: Mark as placeholder with a clear TODO comment:

```ts
// TODO: Replace with real data from Supabase
stats: { label: 'Depth', value: '—' }, // placeholder
```

#### 6. Refactor `getDepartmentTabs()`

**Problem**: 9 sequential `if` statements.

**Solution**: Use a lookup map:

```ts
const DEPARTMENT_TABS_MAP: Record<string, readonly Tab[]> = {
  'control-room': CONTROL_ROOM_TABS,
  'access-control': ACCESS_CONTROL_TABS,
  'access-card-actions': ACCESS_CARD_ACTIONS_TABS,
  'satellite-monitoring': SATELLITE_MONITORING_TABS,
  engineering: ENGINEERING_TABS,
  drilling: DRILLING_TABS,
  training: TRAINING_TABS,
  safety: SAFETY_TABS,
  admin: ADMIN_TABS,
}

export function getDepartmentTabs(departmentName: string) {
  return DEPARTMENT_TABS_MAP[departmentName] ?? DEPARTMENT_TABS
}
```

#### 7. Enable stricter tsconfig

**Problem**: `noUnusedLocals` and `noUnusedParameters` are `false`.

**Solution**: Set both to `true` in root `tsconfig.json`:

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 8. Implement stub metrics

**Problem**: `incrementMetric` and `recordMetric` are empty stubs.

**Solution**: Either implement them:

```ts
export function incrementMetric(name: string, value: number = 1) {
  const entry = jobMetrics.get(name) ?? { count: 0, errors: 0, totalDurationMs: 0 }
  entry.count += value
  jobMetrics.set(name, entry)
}

export function recordMetric(name: string, value: number) {
  const entry = jobMetrics.get(name) ?? { count: 0, errors: 0, totalDurationMs: 0 }
  entry.totalDurationMs += value
  jobMetrics.set(name, entry)
}
```

Or remove them if they're not needed.

#### 9. Fix `api-guard.ts`

**Problem**: Hardcoded config and shared identifier.

**Solution**: Accept route-specific configuration:

```ts
export async function runApiGuards(
  req: NextRequest,
  options?: {
    rateLimitConfig?: { windowMs: number; maxRequests: number }
    identifier?: string
    skipSSRF?: boolean
  }
) {
  const config = options?.rateLimitConfig ?? { windowMs: 60000, maxRequests: 100 }
  const identifier = options?.identifier ?? req.nextUrl.pathname
  // ...
}
```

---

## 3. Security & Auth — 8.5/10

### Strengths

- **`proxy.ts` (Next.js 16 middleware)** is well-designed:
  - Open redirect prevention via `isValidRedirect()` with protocol/scheme blocklist (`data:`, `javascript:`, `vbscript:`, `//`, `/\`).
  - Department-based access control with Redis-cached employee role/department checks.
  - Session cookie detection, token expiry detection, and automatic sign-out for expired tokens.
  - Public path bypassing for static assets, API routes, and auth callbacks.
  - `copyCookies()` preserves auth cookies across redirects.
- **Security headers** in `next.config.mjs` are comprehensive:
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`
  - `Strict-Transport-Security` with preload
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` disabling camera/mic/geolocation
  - CSP with production enforcement and dev report-only mode
  - `X-Accel-Buffering: no` for streaming support
- **SSRF Guard** (`lib/api/ssrf-guard.ts`) is thorough:
  - Blocks private IPv4 ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 100.64.0.0/10, 0.0.0.0/8)
  - Blocks private IPv6 prefixes (::1, ::, fe80:, fc00:, fd00:, ff00:)
  - Blocks cloud metadata endpoints (169.254.169.254, metadata.google.internal)
  - Blocks .internal and .local TLDs
  - Enforces HTTPS in production, allows HTTP in dev only
- **CSRF Guard** (`lib/api/csrf-guard.ts`):
  - Validates Origin/Referer against `NEXT_PUBLIC_APP_URL`
  - Fails closed on misconfigured app URL
  - Skips in non-production for curl/direct API testing
  - Requires Origin or Referer for mutating requests in production
- **Rate limiting** via `@repo/rate-limiter` with three strategies (Fixed Window, Token Bucket, Sliding Window) and Redis/in-memory stores. The portal's `rate-limit-middleware.ts` adds:
  - IP whitelist bypass
  - Load-adaptive throttling (scales to 50% when CPU > 85%)
  - Token bucket for AI calls, sliding window for others
  - `timingSafeEqual` for internal secret comparison (timing-attack safe)
  - Proper rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After)
  - `DISABLE_RATE_LIMIT` intentionally ignored in production
- **Service-role key isolation**: `createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY` with `autoRefreshToken: false, persistSession: false` — correct for server-side admin operations.
- **RLS audit tool** (`tools/audit-rls.cjs`) exists for verifying Row-Level Security policies.
- **Auth helpers** (`lib/api/auth.ts`): `requireAuth()`, `requireRole()`, `requireAdmin()` — clean, composable auth guard pattern returning discriminated unions.
- **PIN auth** has separate hash/verify routes, suggesting proper cryptographic handling.

### Issues

- **CSP allows `'unsafe-inline'` and `'unsafe-eval'`** for scripts — this significantly weakens XSS protection. While Next.js often requires some inline scripts, `'unsafe-eval'` should be eliminated (it's only needed for `eval()` or `new Function()`).
- **`resolveEmployee` caches auth data for 3600s (1 hour)** — if an employee's role or department access changes, they retain elevated access for up to an hour. This is a **privilege escalation window**.
- **Rate limiter fails open**: `catch { return { allowed: true, ... } }` — if Redis is down, all rate limits are bypassed. This is a deliberate availability-over-security tradeoff but should be documented and optionally configurable.
- **`api-guard.ts` uses a shared rate limit identifier** (`'api-guard-id'`) — all routes using `runApiGuards` share the same rate limit bucket, which means a burst to one route consumes the quota for all others.

### Recommendations & Solutions

#### 1. Tighten CSP

**Problem**: CSP allows `'unsafe-eval'` which is only needed for `eval()` or `new Function()`.

**Solution**:

1. Remove `'unsafe-eval'` from the CSP `script-src` directive
2. If any code depends on `eval()` or `new Function()`, refactor it
3. For inline scripts, use nonces or hashes:

```
script-src 'self' 'nonce-{random}' 'strict-dynamic'
```

4. Test thoroughly in dev mode (CSP-Report-Only) before enforcing in production

#### 2. Reduce auth cache TTL

**Problem**: Employee auth data cached for 1 hour — privilege changes take up to 1 hour to take effect.

**Solution**:

1. Reduce TTL from 3600s to 300s (5 minutes):

```ts
await cacheSet(cacheKey, data as EmployeeAuth, 300) // 5 minutes
```

2. Or implement cache invalidation on role/department changes:

```ts
// When an employee's role changes:
await cacheEvictL1ByPrefix(`arch:auth:employee:${userId}`)
// Or use tag-based invalidation:
await cacheSet(cacheKey, data, 3600, { tags: [`employee:${userId}`] })
// When role changes:
await cacheInvalidateTags([`employee:${userId}`])
```

#### 3. Add fail-closed option to rate limiter

**Problem**: Rate limiter fails open when Redis is down — all requests allowed.

**Solution**: Add a `failClosed` option:

```ts
export async function withRateLimit(
  request: Request | NextRequest,
  handler: () => Promise<NextResponse>,
  options?: {
    customLimit?: { windowMs: number; maxRequests: number }
    skipIf?: (_request: Request | NextRequest) => boolean
    failClosed?: boolean // Default: false
  }
): Promise<NextResponse> {
  // ...
  try {
    const result = await checkRateLimit(identifier, config, path)
    // ...
  } catch {
    if (options?.failClosed) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit check failed' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return handler() // fail open (default)
  }
}
```

Use `failClosed: true` for security-critical endpoints (auth, admin, etc.).

#### 4. Fix `api-guard.ts` shared identifier

**Problem**: All routes using `runApiGuards` share the same rate limit bucket.

**Solution**: Use the request path as the identifier:

```ts
export async function runApiGuards(req: NextRequest) {
  const config = { windowMs: 60000, maxRequests: 100 }
  const result = await checkRateLimit(req.nextUrl.pathname, config, req.nextUrl.pathname)
  // ...
}
```

---

## 4. API Design & Backend — 7.0/10

### Strengths

- **Consistent handler patterns**: Most routes use `withRateLimit()` wrapper composition, separating middleware concerns from business logic.
- **Comprehensive health check system**: Multiple health endpoints (`/api/health`, `/api/health/ready`, `/api/health/live`, `/api/health/redis`, `/api/health/supabase-realtime`, `/api/health/cache`, `/api/health/fuxa`, `/api/health/warmup`) following Kubernetes-style liveness/readiness separation.
- **API versioning**: `/api/v2/health/` exists, showing forward-thinking versioning.
- **Export endpoints** for fuel-logs, machines, monthly-report, production, safety-incidents — comprehensive operational reporting.
- **Webhook system** with CRUD operations, logs, and idempotency support.
- **Inngest integration** for background job processing.
- **OpenAPI spec generation** via `scripts/generate-openapi-spec.js` and Swagger UI at `/api/doc`.
- **CORS handling** with `applyCors()` utility and configurable allowed origins.
- **Body size limiting** via `withBodyLimit()` middleware.
- **Background jobs** (`lib/jobs/`): shift-completeness-check, orphaned-record-detection, automated-audit, embedding-generation, memory-persist, report-generation, sync-playback, cache-cleanup — comprehensive async task coverage.
- **Report generation** (`lib/reports/`): audit-aggregator, shift-integrity, AuditReportDocument template.

### Issues

- **Two metrics endpoints exist** (`/api/metrics` and `/api/metrics/prometheus`) — potential duplication or unclear separation of concerns.
- **`c66` route** — unclear what this does from the name alone; cryptic naming hurts discoverability.
- **Some routes lack visible input validation** — not all routes use the `@repo/contract` Zod schemas consistently.
- **Admin data route** (`/api/admin/data/[table]/route.ts`) with dynamic table parameter is architecturally concerning — it's essentially a generic CRUD endpoint, which is hard to secure and maintain.
- **No visible API middleware abstraction** — each route manually composes `withRateLimit`, `withBodyLimit`, `applyCors`. A higher-order `apiHandler()` wrapper would reduce boilerplate.
- **Duplicate rate limiter implementation** — `lib/api/rate-limit-middleware.ts` re-implements classes from `@repo/rate-limiter` instead of importing them.
- **`api-guard.ts` is too simplistic** — hardcoded config, shared identifier, and it applies SSRF check to `req.url` (the API route's own URL, not a user-supplied URL), which doesn't make sense for most routes.

### Recommendations & Solutions

#### 1. Create a unified `apiHandler()` HOC

**Problem**: Each route manually composes middleware — boilerplate and inconsistency.

**Solution**: Create a higher-order function:

```ts
// lib/api/handler.ts
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from './rate-limit-middleware'
import { withBodyLimit } from './body-limit'
import { applyCors } from './cors'
import { withErrorLogging } from '@/lib/errors/error-logger'
import { z, ZodSchema } from 'zod'

interface ApiHandlerOptions {
  rateLimit?: { windowMs: number; maxRequests: number }
  bodyLimit?: number
  validation?: { body?: ZodSchema; query?: ZodSchema }
  requireAuth?: boolean
  requireRole?: string[]
  skipCors?: boolean
}

export function apiHandler(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  return async (req: NextRequest) => {
    try {
      // 1. CORS
      const response = await withRateLimit(req, () =>
        withBodyLimit(
          req,
          async () => {
            // 2. Auth
            if (options.requireAuth || options.requireRole) {
              const auth = options.requireRole
                ? await requireRole(options.requireRole)
                : await requireAuth()
              if ('error' in auth) return auth.error
              return await handler(req, auth)
            }
            return await handler(req, {} as AuthContext)
          },
          { maxSize: options.bodyLimit }
        )
      )
      return options.skipCors ? response : applyCors(req, response)
    } catch (error) {
      await logError(error instanceof Error ? error : new Error(String(error)), {
        url: req.url,
        method: req.method,
      })
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
```

#### 2. Consolidate metrics endpoints

**Problem**: Two metrics endpoints with unclear separation.

**Solution**: Either merge them into one endpoint with format negotiation, or clearly document:

- `/api/metrics` — JSON format for application consumption
- `/api/metrics/prometheus` — Prometheus text format for scraping

#### 3. Enforce Zod validation on all mutating routes

**Problem**: Not all POST/PUT/PATCH routes use Zod validation.

**Solution**: Add a `withValidation()` middleware:

```ts
export function withValidation(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return async (req: NextRequest, next: (data: any) => Promise<NextResponse>) => {
    const data = source === 'body' ? await req.json() : Object.fromEntries(req.nextUrl.searchParams)
    const result = schema.safeParse(data)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 422 }
      )
    }
    return next(result.data)
  }
}
```

#### 4. Rename `c66` route

**Problem**: Cryptic naming hurts discoverability.

**Solution**: Rename to something descriptive (e.g., `/api/ops/gateway` or whatever `c66` actually represents).

#### 5. Replace generic admin data route

**Problem**: `/api/admin/data/[table]` is a generic CRUD endpoint — hard to secure.

**Solution**: Replace with specific, purpose-built endpoints:

- `/api/admin/personnel` instead of `/api/admin/data/personnel`
- `/api/admin/badges` instead of `/api/admin/data/badges`
- etc.

#### 6. Use `@repo/rate-limiter` in the portal

**Problem**: Duplicated rate limiter code.

**Solution**: Import from the package instead of re-implementing:

```ts
import {
  RateLimiter,
  RedisStore,
  SlidingWindowStrategy,
  TokenBucketStrategy,
} from '@repo/rate-limiter'
```

#### 7. Fix `api-guard.ts`

**Problem**: Shared identifier and misapplied SSRF check.

**Solution**: Use per-route identifiers and only apply SSRF check to user-supplied URLs:

```ts
export async function runApiGuards(req: NextRequest, options?: { skipSSRF?: boolean }) {
  // 1. Rate Limit (per-route identifier)
  const config = { windowMs: 60000, maxRequests: 100 }
  const result = await checkRateLimit(req.nextUrl.pathname, config, req.nextUrl.pathname)
  if (!result.allowed) {
    throw new AppError({ code: 'RATE_LIMITED', message: 'Too Many Requests', status: 429 })
  }
  // 2. SSRF Guard (only when processing user-supplied URLs)
  if (!options?.skipSSRF) {
    // Only check user-supplied URLs, not req.url
  }
}
```

---

## 5. UI/UX & Frontend — 7.5/10

### Strengths

- **Innovative OS-style desktop UI**: The portal mimics a macOS/Windows hybrid desktop with menu bar (`ArchMacMenuBar`), system tray (`SystemTray`), start menu (`ArchStartMenu`), lock overlay (`ArchLockOverlay`), split-window panes (`SplitWindowLayout`), and command palette (`CommandBar`). This is a unique, ambitious UX for an industrial portal.
- **Glass/transparency design system** with formal documentation (`docs/design-system/DESIGN.md`, `RULES.md`, `SPEC.md`) and enforcement via `AGENTS.md` policy. Token-based theming via `@repo/theme`.
- **RSC-first architecture**: Server Components are the default, with `"use client"` only where interactivity is required. Data access stays in Server Actions/RSC, preserving the data boundary.
- **PWA support**: Manual service worker (`public/sw.js`), manifest, offline page (`/offline`), PWA install button, and offline queue (`useOfflineQueue`).
- **Performance-conscious**: `PerformanceListener`, `WebVitalsReporter`, `useAdaptivePerformance` hook, `RouteBackground` component, Suspense streaming, `cacheComponents: true` in next.config.
- **Comprehensive component library** in `@repo/ui`: GlassCard, KPI, Marquee, AnimatedButton, DepartmentLayout, EmptyState, ErrorBoundary, plus shadcn-style primitives (button, input, table, tabs, dialog, dropdown-menu, etc.).
- **Parallel routes & intercepting routes**: `@modal` for modal overlays, `(.)quickview` for intercepted routes — modern Next.js patterns.

### Issues

- **Hardcoded mock data in `departments.ts`**: The `DEPARTMENTS` array has static stats (`{ label: 'Depth', value: '1,240m' }`) and trends that don't come from any data source. This looks like demo data left in production code.
- **`getDepartmentTabs()` if-chain** — 9 sequential conditionals instead of a map lookup. Adding a new department requires editing this function.
- **Duplicate exports in `@repo/ui`**: Both `./Marquee` and `./components/ui/marquee` point to different files (`src/components/Marquee.tsx` vs `src/components/ui/marquee.tsx`). Similarly, `./spinner` and `./components/ui/spinner` exist. This is confusing.
- **`src.backup` excluded from tsconfig** — suggests there's a backup directory that should probably be removed.
- **`framer-motion` in `@repo/ui` dependencies** but `next.config.mjs` has `optimizePackageImports: ["framer-motion"]` — this is good, but the `framer-motion-shim.tsx` in `ui/src/lib/` suggests compatibility issues.

### Recommendations & Solutions

#### 1. Replace hardcoded department stats

**Problem**: Static mock data in production code.

**Solution**: Fetch real data from Supabase in a Server Component:

```tsx
// In the hub page or department card component
async function DepartmentCard({ dept }: { dept: Department }) {
  const supabase = await createServerSupabaseClient()
  const { data: stats } = await supabase
    .from('department_stats')
    .select('label, value')
    .eq('department', dept.name)

  return <Card stats={stats ?? []} {...dept} />
}
```

#### 2. Refactor `getDepartmentTabs()` to use a lookup map

**Problem**: 9 sequential `if` statements.

**Solution**:

```ts
const DEPARTMENT_TABS_MAP: Record<string, readonly Tab[]> = {
  'control-room': CONTROL_ROOM_TABS,
  'access-control': ACCESS_CONTROL_TABS,
  'access-card-actions': ACCESS_CARD_ACTIONS_TABS,
  'satellite-monitoring': SATELLITE_MONITORING_TABS,
  engineering: ENGINEERING_TABS,
  drilling: DRILLING_TABS,
  training: TRAINING_TABS,
  safety: SAFETY_TABS,
  admin: ADMIN_TABS,
}

export function getDepartmentTabs(departmentName: string) {
  return DEPARTMENT_TABS_MAP[departmentName] ?? DEPARTMENT_TABS
}
```

#### 3. Clean up duplicate exports in `@repo/ui`

**Problem**: Both `./Marquee` and `./components/ui/marquee` exist.

**Solution**: Standardize on one export path. Remove duplicate entries from `package.json` exports. Keep either:

- Top-level: `./Marquee` → `./src/components/Marquee.tsx`
- Or namespaced: `./components/ui/marquee` → `./src/components/ui/marquee.tsx`

Not both. Same for `./spinner` vs `./components/ui/spinner`.

#### 4. Remove `src.backup`

**Problem**: Backup directory excluded from tsconfig.

**Solution**: If `src.backup` exists, remove it. If it was a migration artifact, it should be in git history, not in the working tree.

#### 5. Document the OS-style UX decision

**Problem**: Ambitious UX may impact accessibility and mobile usability.

**Solution**: Add documentation in `docs/design-system/DESIGN.md` explaining:

- Why the OS-style desktop metaphor was chosen
- Accessibility considerations and mitigations
- Mobile responsiveness strategy
- Fallbacks for users who need a simpler interface

---

## 6. Testing & QA — 5.5/10

### Strengths

- **Jest 30** with `@swc/jest` for fast compilation — modern testing stack.
- **Test files exist** for critical paths: `proxy.test.ts`, `actions.test.ts`, `auth/login/route.test.ts`, `auth/logout/route.test.ts`, `webhooks/route.test.ts`, `telemetry/push/route.test.ts`, `export/fuel-logs/route.test.ts`, `metrics/route.test.ts`, `c66/route.test.ts`, `sync/playback/route.test.ts`, `plugins/rust-telemetry/route.test.ts`.
- **Component tests**: `GlassCard.test.tsx`, `BottomNav.test.tsx`, `ServicesDropdown.test.tsx`, `ArchStartMenu.test.tsx`, `SystemTray.test.tsx`, `SplitWindowLayout.test.tsx`, `ViewportBoundaries.test.tsx`, `Pagination.test.tsx`, `PerformanceListener.test.tsx`, `RouteBackground.test.ts`, `ui-primitives.test.tsx`, `ReviewSchema.test.tsx`.
- **Lib tests**: `accessible-departments.test.ts`, `audit.test.ts`, `department-cache.test.ts`, `departments.routes.test.ts`, `departments.test.ts`, `dept-access.test.ts`, `dept-auth-integration.test.ts`, `dept-auth-wrappers.test.ts`, `employee.test.ts`, `env.test.ts`, `next-cache-handler.test.ts`.
- **API middleware tests**: `rate-limit-middleware.test.ts`.
- **Hook tests**: `useAdaptivePerformance.test.ts`, `useOfflineQueue.test.ts`, `useSystemMetrics.test.ts`.
- **Package tests**: `@repo/supabase` (client, middleware, read-replica, server, service-role), `@repo/errors`, `@repo/rate-limiter`, `@repo/redis` (l1), `@repo/contract` (validation).
- **E2E tests** with Playwright (`e2e/` directory).
- **Production test suite** (`scripts/production-test-suite.sh`) with `--strict`, `--json`, `--url` modes.
- **Migration safety tests** in `@repo/database` (`migration-rollback-safety.mjs`, `p0_signup_role_self_elevation.sql`).
- **Prometheus alert rules coverage test** — testing that monitoring rules are complete.
- **Job tests**: `automated-audit.test.ts`, `cache-cleanup.test.ts`.
- **AI tests**: `embedding-provider.test.ts`, `rag-benchmark.test.ts`.
- **Error logger tests**: `error-logger.test.ts`.
- **Report tests**: `audit-aggregator.test.ts`.

### Issues

- **No visible test coverage reporting** — no `--coverage` flag in test scripts, no coverage thresholds configured.
- **`--passWithNoTests` flag** in portal test script — this silently passes when no tests match, potentially hiding missing test files.
- **No visible integration tests** for the full request lifecycle (proxy → auth → department access → API route → response).
- **No visible snapshot tests** for UI components.
- **No visible load/stress testing** setup.
- **`lint` script in `@repo/database`** just echoes "No lintable files" — this is a missed opportunity to lint SQL migrations or TypeScript types.
- **Test file naming inconsistency**: Portal uses `*.test.ts(x)` while packages use `*.test.ts` and some use `__tests__/` directories.

### Recommendations & Solutions

#### 1. Add coverage reporting

**Problem**: No coverage measurement.

**Solution**: Add coverage to Jest config and set thresholds:

```js
// jest.config.cjs
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // ...
}
```

Add to `package.json` scripts:

```json
{
  "test:coverage": "jest --coverage"
}
```

#### 2. Remove `--passWithNoTests`

**Problem**: Silently passes when no tests match.

**Solution**: Remove the flag or make it CI-only:

```json
{
  "test": "jest --maxWorkers=50%",
  "test:ci": "jest --maxWorkers=50% --passWithNoTests"
}
```

#### 3. Add integration tests

**Problem**: Full request lifecycle is untested.

**Solution**: Create integration tests that test the full flow:

```ts
// tests/integration/auth-flow.test.ts
describe('Auth flow integration', () => {
  it('should redirect unauthenticated users to login', async () => {
    // Test: unauthenticated request → proxy → redirect to /login
  })

  it('should allow authenticated users to access their department', async () => {
    // Test: authenticated request → proxy → department check → render
  })

  it('should deny access to unauthorized departments', async () => {
    // Test: authenticated user → wrong department → redirect with error
  })
})
```

#### 4. Add snapshot tests for UI components

**Problem**: No visual regression testing.

**Solution**: Add snapshot tests for key components:

```tsx
it('renders correctly', () => {
  const { container } = render(<GlassCard>Test</GlassCard>)
  expect(container).toMatchSnapshot()
})
```

#### 5. Standardize test file naming

**Problem**: Inconsistent naming across the monorepo.

**Solution**: Standardize on `*.test.ts(x)` for all tests. Move `__tests__/` directory tests to co-located `*.test.ts` files.

#### 6. Add linting to `@repo/database`

**Problem**: Lint script just echoes "No lintable files".

**Solution**: Add ESLint config for the database package and lint TypeScript types and SQL migration files.

---

## 7. Performance & Optimization — 8.0/10

### Strengths

- **Redis-backed Next.js 16 CacheHandler** (`lib/next-cache-handler.ts`) — this is a sophisticated, production-grade implementation:
  - Circuit breaker with cross-pod pub/sub coordination
  - Exponential backoff retry with jitter
  - In-memory metrics for Prometheus
  - Distributed tag revalidation across pods
  - Graceful degradation to in-memory cache when Redis is down
  - Pending set tracking (get() waits for in-flight set())
  - Rate-limited audit logging
- **CacheLife profiles** configured in `next.config.mjs` (1 minute, 5 minutes, 24 hours) with proper stale/revalidate/expire values.
- **Turbopack** enabled for development (`next dev --turbopack`).
- **`cacheComponents: true`** — Next.js 16's experimental component caching.
- **`inlineCss: true`** — critical CSS inlining for faster FCP.
- **`webVitalsAttribution`** — CLS, LCP, FCP, TTFB, INP attribution for performance debugging.
- **`viewTransition: true`** — View Transitions API support.
- **`removeConsole`** in production (excluding error/warn/info).
- **Image optimization**: AVIF/WebP formats, comprehensive device/image sizes, 24-hour minimum cache TTL.
- **Standalone output** for Docker optimization (when `ENABLE_HEAVY_PLUGINS` or CI).
- **`optimizePackageImports: ["framer-motion"]`** — reduces bundle size.
- **`transpilePackages`** for all `@repo/*` packages — ensures proper compilation.
- **Comprehensive cache headers** in production: manifest, sw.js, workbox, login, health, auth, AI, static assets — each with appropriate `Cache-Control` values.
- **Performance insights documentation** in `docs/performance-insights/` — 20+ files covering LCP, INP, CLS, CSS selectors, DOM size, font display, image delivery, etc.
- **Load-adaptive rate limiting** — scales down to 50% when CPU > 85%, protecting the system under load.

### Issues

- **`@repo/ui` has heavy dependencies**: `framer-motion`, `@revolist/react-datagrid`, `@revolist/revogrid`, multiple Radix UI packages — these can significantly impact bundle size.
- **No visible bundle size analysis** in CI (`.size-limit.json` exists but isn't in the `quality` script).
- **The `departments.ts` mock data** includes `trend` arrays — if these are rendered as charts, they're rendering static data unnecessarily.

### Recommendations & Solutions

#### 1. Add `size-limit` checks to CI

**Problem**: No bundle size monitoring.

**Solution**: Add `size-limit` to the quality script:

```json
{
  "quality": "turbo run lint type-check test --concurrency=4 && pnpm format:check && pnpm size"
}
```

Configure thresholds in `.size-limit.json`.

#### 2. Code-split heavy dependencies

**Problem**: `@revolist/datagrid` is likely only used in admin/data views but is in the main bundle.

**Solution**: Dynamic import for data grid components:

```tsx
const DynamicTable = dynamic(() => import('./DynamicTable'), {
  loading: () => <Skeleton />,
  ssr: false,
})
```

#### 3. Add Lighthouse CI

**Problem**: No automated performance regression detection.

**Solution**: Add Lighthouse CI to the pipeline:

```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun --config=lighthouserc.json
```

#### 4. Lazy-load heavy components

**Problem**: PDF renderer, QR code styler loaded eagerly.

**Solution**: Use `next/dynamic` for heavy components:

```tsx
const PDFReport = dynamic(() => import('./PDFReport'), { ssr: false })
const QRCode = dynamic(() => import('./QRCode'), { ssr: false })
```

---

## 8. Observability & Monitoring — 8.0/10

### Strengths

- **Sentry integration** with separate client/server configs, source map upload in CI, tunnel route (`/monitoring`), and `hideSourceMaps: true`.
- **OpenTelemetry** support via `@vercel/otel`, `instrumentation.ts`, `instrumentation-client.ts`, and `OTEL_EXPORTER_OTLP_ENDPOINT` configuration.
- **Prometheus + Grafana + Alertmanager** stack in `ops/`:
  - `prometheus.yml` with scrape configs
  - `alert-rules.yaml` with alert definitions
  - `cache-handler-dashboard.json` for Grafana
  - `alertmanager.yaml` with notification routing
- **Custom metrics endpoint** (`/api/metrics/prometheus`) for exposing application metrics.
- **Cache handler metrics** with in-memory counters (getCalls, getHits, getMisses, getErrors, setCalls, setErrors, circuit breaker states, retries).
- **Circuit breaker state** exposed via `getCircuitBreakerState()`.
- **Web Vitals reporting** via `WebVitalsReporter` component.
- **CSP violation reporting** endpoint (`/api/csp-violations`).
- **DB query instrumentation** via `instrumentedFetch()` in `@repo/supabase/server.ts` — records PostgREST timing.
- **Structured error logging** via `lib/errors/error-logger.ts`:
  - Severity levels (debug, info, warn, error, fatal) based on status code
  - Structured log entries with timestamp, code, statusCode, context, cause, stack, url, method, userId, sessionId
  - Sentry integration for error/fatal severity
  - `@repo/logger` serverLogger() integration
  - `withErrorLogging()` HOC for API routes
  - `withServerActionLogging()` HOC for server actions
  - Never throws (catches its own errors)
- **Observability metrics** (`lib/observability/metrics.ts`): job execution metrics, DB query metrics, with record/get/clear functions.
- **Runbooks** for operational incidents: `circuit-breaker-open.md`, `redis-connection-down.md`.
- **Ops babysitter script** and `portal-watchdog.sh` for automated monitoring.
- **Health check endpoints** for every critical dependency (Redis, Supabase, Supabase Realtime, FUXA, cache).

### Issues

- **Stub implementations in observability/metrics.ts**: `incrementMetric` and `recordMetric` are empty stubs — functionality is advertised but not implemented.
- **No visible distributed tracing** setup beyond OTEL config — no visible spans for DB queries, Redis operations, or API calls.
- **Alert rules coverage test** exists but it's unclear if alerts are actually wired to notification channels (Slack, email, PagerDuty).

### Recommendations & Solutions

#### 1. Implement stub metrics

**Problem**: `incrementMetric` and `recordMetric` are empty stubs.

**Solution**: Implement them:

```ts
export function incrementMetric(name: string, value: number = 1) {
  const entry = jobMetrics.get(name) ?? { count: 0, errors: 0, totalDurationMs: 0 }
  entry.count += value
  jobMetrics.set(name, entry)
}

export function recordMetric(name: string, value: number) {
  const entry = jobMetrics.get(name) ?? { count: 0, errors: 0, totalDurationMs: 0 }
  entry.totalDurationMs += value
  jobMetrics.set(name, entry)
}
```

#### 2. Add distributed tracing spans

**Problem**: No visible tracing spans for critical paths.

**Solution**: Add OTEL spans for DB queries, Redis operations, and API calls:

```ts
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('arch-portal')

async function fetchData() {
  return tracer.startActiveSpan('fetch-data', async (span) => {
    try {
      const result = await supabase.from('table').select()
      span.setAttribute('db.table', 'table')
      span.setAttribute('db.rows', result.data?.length ?? 0)
      return result
    } catch (err) {
      span.recordException(err)
      span.setStatus({ code: 2 }) // ERROR
      throw err
    } finally {
      span.end()
    }
  })
}
```

#### 3. Verify alert routing

**Problem**: Unclear if alerts reach notification channels.

**Solution**: Verify `ops/alertmanager/alertmanager.yaml` has real receiver configs (Slack, email, PagerDuty) and test alert delivery.

#### 4. Add log aggregation documentation

**Problem**: No visible log aggregation setup.

**Solution**: Add documentation for log aggregation (ELK, Loki, or CloudWatch) in `docs/runbooks/`.

---

## 9. Documentation — 9.0/10

### Strengths

- **Exceptional documentation breadth**: 40+ documentation files across `docs/` covering architecture, audits, caching, codebase maps, deployment, migration, optimization, performance, runbooks, and onboarding.
- **Codebase maps** (`docs/codebase-maps/`): API routes, architectural graph matrix, caching layers, client-server boundaries, data flow, dataflow pipelines, monorepo structure, packages and dependencies, portal page routes, workspace packages — these are invaluable for onboarding.
- **Architecture documentation**: Architecture diagrams, foundational gap analysis, scalability reference — shows forward-thinking architectural planning.
- **Audit documentation**: Backend audit, duplication audit, type error catalog — demonstrates commitment to code quality tracking.
- **Design system documentation**: `DESIGN.md` (intent/principles), `RULES.md` (enforceable must/must-not), `SPEC.md` (exact token values) — this is a professional, enforced design system.
- **Runbooks** for operational incidents with clear remediation steps.
- **Performance insights** — 20+ files covering web performance best practices.
- **AGENTS.md** policy files at root and portal level — clear agent guidelines.
- **DEPLOY_CHECKLIST.md** for deployment verification.
- **AGENT_TRACER.md** files — trace agent modifications for audit trails.

### Issues

- **README is stale** — references non-existent apps, wrong tooling (Nx vs Turborepo), and has a stray `# asd`.
- **Some docs may be outdated** — the migration docs reference NestJS → Next.js migration, but it's unclear if the migration is complete or ongoing.
- **`docs/performance/` and `docs/performance-insights/`** appear to be duplicate directories — `docs/performance/insights/` and `docs/performance-insights/` both exist.

### Recommendations & Solutions

#### 1. Update the README

**Problem**: Stale, inaccurate README.

**Solution**: Rewrite to accurately reflect the current state (see Architecture section for details).

#### 2. Consolidate duplicate doc directories

**Problem**: `docs/performance/` and `docs/performance-insights/` both exist.

**Solution**: Merge into one directory (`docs/performance-insights/`) and update all cross-references.

#### 3. Add CONTRIBUTING.md

**Problem**: No contribution guide.

**Solution**: Create `CONTRIBUTING.md` with:

- Development setup instructions
- Coding standards
- PR process
- Testing requirements
- Commit message conventions

#### 4. Verify migration docs

**Problem**: Migration docs may be outdated.

**Solution**: Review `docs/migration/nestjs-to-nextjs-migration.md` and either mark as complete or update with remaining work.

---

## 10. DevOps & Deployment — 6.5/10

### Strengths

- **Multiple deployment modes**: `scripts/dev.sh` (local dev), `deploy-production.sh` (root, Docker), `scripts/deploy-production.sh` (interactive, full stack), `scripts/live-deployment.sh`, `scripts/start-prod.sh`.
- **Docker Compose** for dev (`docker-compose.yml`), staging (`docker-compose.staging.yml`), and production (`docker-compose.production.yml`).
- **Profile-based Docker Compose** — `infra` (Redis), `postgres`, `portal` profiles for selective startup.
- **Health checks** in Docker Compose for portal, Redis, and Postgres.
- **Environment validation** via `scripts/validate-env.sh` with `--production` flag.
- **Smoke tests** via `scripts/smoke-test.sh`.
- **Production test suite** with strict/JSON/URL modes.
- **Backup script** (`scripts/backup-db.sh`) with crontab installation.
- **Shutdown script** for clean teardown.
- **Vercel deployment** support via `vercel.json`.
- **Dockerfile** with multi-stage build (target: runner).
- **Husky + lint-staged** for pre-commit quality gates.
- **Commitlint** with conventional commits config.

### Issues

- **Two divergent production deployment scripts**: `deploy-production.sh` (root) and `scripts/deploy-production.sh` are different scripts with different behavior — this is a **significant operational risk**. Team members may use the wrong one.
- **`scripts/dev.sh` is 715 lines** — this is an extremely large shell script that's hard to maintain and debug. It handles Redis, Supabase, Ops Gateway, Next.js, watchdog restarts, port management, and more.
- **No visible CI/CD pipeline** definition (no `.github/workflows/` visible in the file listing, though README badges reference GitHub Actions).
- **Docker Compose volumes** in dev mount source code (`./apps/portal/src:/app/apps/portal/src`) — this is fine for dev but the production compose should not do this.
- **`vercel.json` exists** but the primary deployment is Docker-based — this creates ambiguity about the canonical deployment path.
- **No visible infrastructure-as-code** (Terraform, Pulumi) for cloud resources.

### Recommendations & Solutions

#### 1. Consolidate deployment scripts

**Problem**: Two `deploy-production.sh` scripts with different behavior.

**Solution**: Merge into one script with clear modes:

```bash
# scripts/deploy.sh
case "$1" in
  --docker)    deploy_docker ;;
  --full-stack) deploy_full_stack ;;
  --restart)   restart_services ;;
  --status)    show_status ;;
  --logs)      show_logs ;;
  --stop)      stop_services ;;
  --backup)    backup_db ;;
  *)           echo "Usage: $0 {--docker|--full-stack|--restart|--status|--logs|--stop|--backup}" ;;
esac
```

Remove the root `deploy-production.sh` and keep only `scripts/deploy.sh`.

#### 2. Break up `dev.sh`

**Problem**: 715-line shell script is unmaintainable.

**Solution**: Split into composable scripts:

```
scripts/
  dev.sh              # Main entry point, calls sub-scripts
  dev-start-redis.sh  # Redis startup
  dev-start-supabase.sh # Supabase startup
  dev-start-portal.sh # Next.js portal startup
  dev-watchdog.sh     # Watchdog/restart logic
  dev-ports.sh        # Port management
  dev-smoke.sh        # Smoke tests
```

#### 3. Add CI/CD pipeline

**Problem**: No visible CI/CD definition.

**Solution**: Create `.github/workflows/quality-gate.yml`:

```yaml
name: Quality Gate
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @repo/theme lint:tokens
      - run: pnpm exec turbo run lint type-check test --force
      - run: pnpm format:check
```

#### 4. Clarify canonical deployment path

**Problem**: Both Vercel and Docker deployment exist.

**Solution**: Document which is canonical in `docs/deployment/deployment.md`. If Docker is canonical, remove or deprecate `vercel.json`.

#### 5. Add infrastructure-as-code

**Problem**: No IaC for cloud resources.

**Solution**: Add Terraform or Pulumi configs for any cloud resources (S3 buckets, Redis instances, etc.).

#### 6. Ensure production Docker Compose doesn't mount source volumes

**Problem**: Dev volume mounts may leak into production.

**Solution**: Verify `docker-compose.production.yml` doesn't have source code volume mounts.

---

## 11. Error Handling & Resilience — 7.5/10

### Strengths

- **Typed error hierarchy** in `@repo/errors`: `AppError` → `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `RateLimitError`, `TooManyRequestsError`, `WebFetchError`, `ServiceUnavailableError`, `InternalError`, `InternalServerError`, `ConflictError`. Each with proper HTTP status codes and `toJSON()` serialization.
- **Portal-level error classes** (`lib/errors/error-classes.ts`): `AppError`, `APIError`, `ValidationError`, `AuthError`, `DatabaseError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `AIProviderError`, `ExternalServiceError` — with `Error.captureStackTrace`, context merging, and type guards (`isAppError`, `isValidationError`, `isAuthError`, `isNotFoundError`).
- **Structured error logging** (`lib/errors/error-logger.ts`):
  - Severity-based logging (debug, info, warn, error, fatal)
  - Sentry integration for error/fatal
  - `@repo/logger` serverLogger() for structured logs
  - `withErrorLogging()` HOC for API routes
  - `withServerActionLogging()` HOC for server actions
  - Never throws (catches own errors)
- **Circuit breaker** in cache handler with CLOSED/OPEN/HALF_OPEN states, cross-pod coordination, configurable failure threshold and cooldown.
- **Exponential backoff retry** with jitter in cache handler.
- **Graceful degradation**: Cache handler falls back to in-memory when Redis is down. Rate limiter fails open. `getUserSafely()` returns null instead of throwing.
- **Error boundary** components (`ErrorBoundary.tsx`, `error.tsx`, `global-error.tsx`).
- **`isTokenExpiredError()`** helper for graceful session expiry handling.
- **`redirectWithError()`** in proxy.ts for auth failure redirects with cookie preservation.
- **Runbooks** for operational incidents.

### Issues

- **Two competing error class hierarchies**: `@repo/errors` (packages) and `lib/errors/error-classes.ts` (portal) have different APIs (`status` vs `statusCode`, `meta` vs `context`). The portal's version explicitly says "Simple error classes to replace @repo/errors package" — this creates confusion about which to use and potential for divergence.
- **Silent catch blocks**: Many `catch {}` blocks silently swallow errors (e.g., in `proxy.ts` cookie setting, cache handler pub/sub setup, `resolveEmployee` cache fallback). While intentional for graceful degradation, they make debugging difficult.
- **`logAuditEvent` doesn't handle insert errors** — the `supabase.from('audit_logs').insert()` call has no error handling. If the insert fails, the audit event is silently lost.
- **Rate limiter catch-all**: `catch { return { allowed: true, ... } }` — all errors result in allowing the request, which could mask configuration issues.
- **`mergeExtra` function in error-classes.ts** has a confusing implementation that mutates the `extra` parameter while iterating over it — this is a code smell that could lead to subtle bugs.

### Recommendations & Solutions

#### 1. Consolidate error classes

**Problem**: Two competing error hierarchies.

**Solution**:

1. Promote portal-specific errors (`AIProviderError`, `ExternalServiceError`, `DatabaseError`) to `@repo/errors`
2. Standardize the API — pick `status` or `statusCode`, and `meta` or `context`
3. Add `Error.captureStackTrace` to `@repo/errors`
4. Deprecate `apps/portal/src/lib/errors/error-classes.ts`
5. Update all imports to use `@repo/errors`

#### 2. Add structured logging to catch blocks

**Problem**: Silent catch blocks make debugging difficult.

**Solution**: Log errors even in graceful degradation:

```ts
// Instead of:
catch { /* ignore */ }

// Use:
catch (err) {
  console.warn('[proxy] Cookie set failed (expected in RSC):', err)
}
```

#### 3. Handle audit log insert errors

**Problem**: Failed audit log inserts are silently lost.

**Solution**: Add error handling and retry:

```ts
const { error: insertError } = await supabase.from('audit_logs').insert({...})
if (insertError) {
  console.error('[audit] Failed to log audit event:', insertError)
  // Optionally: queue for retry or send to Sentry
  await logError(new Error('Audit log insert failed'), {
    context: 'logAuditEvent',
    table: input.tableName,
    action: input.action,
  })
}
```

#### 4. Refactor `mergeExtra`

**Problem**: Mutates `extra` parameter while iterating.

**Solution**: Make it a pure function:

```ts
function mergeExtra(
  base: Record<string, unknown> | undefined,
  extra: Record<string, unknown>
): Record<string, unknown> {
  const { context: _c, cause: _c2, ...rest } = extra
  return { ...base, ...rest }
}
```

---

## 12. Dependency Management — 7.5/10

### Strengths

- **Volta** pins Node.js (24.15.0) and pnpm (9.15.9) versions for team consistency.
- **`pnpm-workspace.yaml`** has security settings: `updateNotifier: false`, `blockExoticSubdeps: true`, `minimumReleaseAge: 2880` (48 hours) to avoid untested dependency drift.
- **`minimumReleaseAgeExclude`** for `@repo/*`, `next`, `react`, `react-dom` — allows immediate updates for internal packages and critical framework deps.
- **`ignoredBuiltDependencies`** for `@swc/core`, `esbuild`, `sharp` — avoids unnecessary native builds.
- **`engines: { node: ">=22" }`** — modern Node.js requirement.
- **Husky + lint-staged** for pre-commit quality gates.
- **Commitlint** with conventional commits.
- **Prettier** for consistent formatting.

### Issues

- **ESLint 8.57.0** is used but ESLint 9.x is the latest — this is a major version behind. The `@typescript-eslint/parser` is at `^8.59.4` which may have compatibility issues with ESLint 8.
- **`zod` is at `^3.24.0`** in multiple packages — Zod 4.x is available with significant performance improvements.
- **`next` is at `^16.2.6`** — this is a very new/bleeding-edge version (Next.js 16). The AGENTS.md warns "This is NOT the Next.js you know" — this is appropriate caution but also indicates potential instability.
- **`react`/`react-dom` at `^19.0.0`** — React 19 is still relatively new.
- **`tailwindcss` at `^3.4.17`** — Tailwind 4.x is available with significant performance improvements.
- **`better-sqlite3` in `@repo/database`** — this is a native module that requires compilation and may cause issues in Docker/CI environments.
- **No visible `renovate.json`** or Dependabot config for automated dependency updates.

### Recommendations & Solutions

#### 1. Upgrade ESLint to 9.x

**Problem**: ESLint 8 is a major version behind.

**Solution**:

1. Upgrade `eslint` to `^9.x` in all package.json files
2. Update `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` to compatible versions
3. Migrate ESLint config to flat config format (`.eslintrc.cjs` → `eslint.config.js`)
4. Test thoroughly with `pnpm lint`

#### 2. Evaluate Zod 4.x migration

**Problem**: Zod 3.x, Zod 4.x available with performance improvements.

**Solution**:

1. Review Zod 4.x breaking changes
2. Test in a branch
3. Migrate if performance improvements are significant

#### 3. Add Renovate or Dependabot

**Problem**: No automated dependency updates.

**Solution**: Add `renovate.json`:

```json
{
  "extends": ["config:recommended"],
  "schedule": ["before 6am on Monday"],
  "rangeStrategy": "bump",
  "packageRules": [
    {
      "matchPackagePatterns": ["next", "react", "react-dom"],
      "extends": ["schedule:earlyMondayMorning"]
    }
  ]
}
```

#### 4. Consider Tailwind 4.x migration

**Problem**: Tailwind 3.x, Tailwind 4.x available.

**Solution**: Evaluate Tailwind 4.x for faster builds and smaller bundles. Review breaking changes before migrating.

#### 5. Replace `better-sqlite3`

**Problem**: Native module causes compilation issues.

**Solution**: Either use PostgreSQL consistently (see Architecture section) or use a pure-JS alternative like `sql.js` for local development.

---

## Key Insights & Future Direction

### What's Working Well

1. **Architecture is solid** — the monorepo structure, package boundaries, and Next.js 16 App Router usage are well-designed.
2. **Security fundamentals are strong** — proxy.ts auth, CSP headers, rate limiting, SSRF guard, CSRF guard, RLS auditing.
3. **Observability is above average** — Sentry, OTEL, Prometheus, circuit breaker metrics, health checks, structured error logging.
4. **Documentation is exceptional** — the breadth and depth of docs is rare and valuable.
5. **The cache handler is production-grade** — circuit breaker, retry, cross-pod coordination, graceful degradation.

### Top Priority Improvements

1. **🔥 Fix type safety** — eliminate `any` types in `@repo/supabase` and `@repo/redis`. This is the biggest code quality issue.
2. **🔥 Consolidate duplicated code** — error classes (two hierarchies), rate limiter (two implementations), metrics (stubs).
3. **🔥 Reconcile database package** — SQLite vs PostgreSQL mismatch needs resolution.
4. **🔥 Consolidate deployment scripts** — two `deploy-production.sh` scripts is a operational hazard.
5. **⚡ Tighten CSP** — remove `'unsafe-eval'` from script-src.
6. **⚡ Reduce auth cache TTL** — 1 hour is too long for privilege changes to take effect.
7. **⚡ Add test coverage reporting** — can't improve what you don't measure.
8. **⚡ Update README** — it's the first thing people see and it's inaccurate.
9. **⚡ Fix `api-guard.ts`** — shared rate limit identifier and misapplied SSRF check.

### Strategic Direction

1. **Consider migrating to Zod 4** for better performance and TypeScript inference.
2. **Evaluate moving to Tailwind 4** for faster builds and smaller bundles.
3. **Invest in integration tests** — the current unit tests are good but the full request lifecycle is untested.
4. **Implement structured logging** — `console.log/warn` is insufficient for production observability. The `@repo/logger` package and `error-logger.ts` exist but need broader adoption.
5. **Add CI/CD pipeline** — the quality scripts exist but aren't automated in a visible pipeline.
6. **Consider an API layer abstraction** — the current per-route middleware composition has boilerplate that a HOC would eliminate.
7. **Plan for React 19 + Next.js 16 stabilization** — these are bleeding-edge versions; monitor for breaking changes and have a rollback plan.
8. **Unify the error handling strategy** — pick one error hierarchy, promote domain-specific errors to the shared package, and deprecate the duplicate.

### Risk Assessment

| Risk                             | Severity | Likelihood | Mitigation                       |
| -------------------------------- | -------- | ---------- | -------------------------------- |
| Type safety holes (`any` types)  | High     | High       | Replace with proper types        |
| Duplicate error hierarchies      | High     | Medium     | Consolidate to one               |
| Duplicate rate limiter code      | Medium   | Medium     | Use `@repo/rate-limiter` package |
| Deployment script divergence     | High     | Medium     | Consolidate scripts              |
| SQLite/PostgreSQL mismatch       | High     | Medium     | Reconcile database package       |
| Auth cache privilege escalation  | Medium   | Low        | Reduce TTL or add invalidation   |
| Rate limiter fail-open           | Medium   | Medium     | Add fail-closed option           |
| Bleeding-edge framework versions | Medium   | Medium     | Pin versions, monitor changelogs |
| Large shell scripts              | Low      | Medium     | Break into composable scripts    |
| Stub metrics implementations     | Low      | High       | Implement or remove              |

---

## Final Verdict

**Arch-System is a well-engineered, ambitious industrial operations portal** that demonstrates strong architectural thinking, security awareness, and operational maturity. The monorepo structure, package boundaries, Next.js 16 usage, cache handler implementation, security guards (SSRF, CSRF, rate limiting), and documentation quality are all above average.

The main areas holding it back from a higher score are:

1. **Type safety gaps** — too many `any` types in critical data access packages
2. **Code duplication** — two error hierarchies, two rate limiter implementations, stub metrics
3. **Test coverage** — good unit tests but missing integration/coverage reporting
4. **Deployment divergence** — multiple scripts doing similar things differently
5. **Stale documentation** — README doesn't match reality

With focused effort on these five areas, this codebase could easily reach **8.5+/10**. The foundation is strong, the patterns are sound, and the team clearly cares about quality — the issues are fixable, not fundamental.

---

## Implementation Priority Matrix

| Priority | Task                                              | Effort | Impact |
| -------- | ------------------------------------------------- | ------ | ------ |
| P0       | Eliminate `any` types in `@repo/supabase`         | Medium | High   |
| P0       | Consolidate error class hierarchies               | Medium | High   |
| P0       | Consolidate rate limiter code                     | Low    | Medium |
| P0       | Reconcile database package (SQLite vs PostgreSQL) | Medium | High   |
| P0       | Consolidate deployment scripts                    | Low    | High   |
| P1       | Tighten CSP (remove `unsafe-eval`)                | Low    | High   |
| P1       | Reduce auth cache TTL                             | Low    | Medium |
| P1       | Fix `api-guard.ts` shared identifier              | Low    | Medium |
| P1       | Update README                                     | Low    | Medium |
| P1       | Implement stub metrics                            | Low    | Medium |
| P2       | Add test coverage reporting                       | Low    | Medium |
| P2       | Add integration tests                             | High   | High   |
| P2       | Create unified `apiHandler()` HOC                 | Medium | Medium |
| P2       | Add CI/CD pipeline                                | Medium | High   |
| P2       | Break up `dev.sh`                                 | Medium | Low    |
| P3       | Refactor `getDepartmentTabs()`                    | Low    | Low    |
| P3       | Clean up duplicate UI exports                     | Low    | Low    |
| P3       | Add `size-limit` to CI                            | Low    | Medium |
| P3       | Add Lighthouse CI                                 | Medium | Medium |
| P3       | Upgrade ESLint to 9.x                             | Medium | Low    |
| P3       | Evaluate Zod 4.x migration                        | High   | Medium |
| P3       | Add Renovate/Dependabot                           | Low    | Low    |
| P3       | Add distributed tracing spans                     | High   | Medium |
| P3       | Add CONTRIBUTING.md                               | Low    | Low    |
| P1       | Implement `@repo/logger` `withLogging()` no-op     | Low    | Medium |
| P1       | Implement `@repo/utils` analytics no-op            | Low    | Medium |
| P2       | Implement or remove `@repo/departments/ui` stub    | Low    | Low    |
| P2       | Clean up `packages/rust-bindings/` reference       | Low    | Low    |
| P1       | Set `no-explicit-any` to 'error' in ESLint         | Low    | Medium |
