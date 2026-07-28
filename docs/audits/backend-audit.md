# Backend Audit Report

**Date:** 2026-07-19  
**Scope:** `apps/api/` (NestJS/Fastify backend)  
**Status:** ⚠️ **Multiple Critical Issues Found**

---

## Executive Summary

The backend API has a well-structured modular architecture with good separation of concerns, but contains several **critical build-breaking issues** and **security vulnerabilities** that prevent proper compilation and deployment.

---

## Critical Issues (Must Fix)

### 1. Missing TypeScript Config Export

**File:** `packages/typescript-config/package.json`  
**Impact:** Build system failure  
**Details:**

- `apps/api/tsconfig.json` extends `@repo/typescript-config/nestjs.json`
- `nestjs.json` exists but is **NOT listed in the exports** of `package.json`
- This causes all type-check and lint operations to fail with:
  ```
  error TS6053: File '@repo/typescript-config/nestjs.json' not found
  ```

**Fix:** Add to `packages/typescript-config/package.json`:

```json
"./nestjs.json": "./nestjs.json"
```

### 2. Missing Supabase Module

**Files Missing:**

- `apps/api/src/supabase/supabase.module.ts`
- `apps/api/src/supabase/supabase.constants.ts`

**Impact:** Runtime failure for database audit and queue modules  
**Details:**

- `db-audit.service.ts` imports `SUPABASE_CLIENT` from `../supabase/supabase.constants` (line 3)
- `admin.service.spec.ts` imports from `../supabase/supabase.constants` (line 3)
- `task.worker.ts` imports `SUPABASE_CLIENT` from `../supabase/supabase.constants` (line 4)
- These files do not exist, causing import errors

**Fix:** Create the missing Supabase module and constants, or update imports to use `@repo/supabase`

### 3. Missing Health Module

**File:** `apps/api/src/app.controller.spec.ts`  
**Impact:** Test file errors  
**Details:**

- References `./health/health.controller` and `./health/indicators/supabase.health`
- These files do not exist in the codebase

---

## Security Issues

### 4. Hardcoded JWT Fallback Secret

**File:** `apps/api/src/auth/auth.service.ts` (line 9)  
**Severity:** High  
**Code:**

```typescript
private readonly jwtSecret = process.env.JWT_SECRET || "fallback-secret";
```

**Issue:** If `JWT_SECRET` is not set, a predictable fallback is used, allowing token forgery.

**Fix:** Throw an error if `JWT_SECRET` is not configured, or use a secure random default.

### 5. Hardcoded JWT Secret in Auth Guard

**File:** `apps/api/src/auth/guards/supabase-auth.guard.ts` (line 21)  
**Severity:** High  
**Code:**

```typescript
private readonly jwtSecret = process.env.JWT_SECRET || "fallback-secret";
```

**Same issue as #4**

### 6. Gateway Proxy Default URL (SSRF Risk)

**File:** `apps/api/src/ops/gateway-proxy.controller.ts` (line 21)  
**Severity:** Medium  
**Code:**

```typescript
this.opsGatewayUrl = this.configService.get<string>('OPS_GATEWAY_URL') ?? 'http://ops-gateway:3100'
```

**Issue:** AGENT_TRACER.md mentions SSRF protection was added, but the code still has a default URL. The AGENT_TRACER indicates this was supposed to be fixed to return 503 when not configured.

**Fix:** Remove the default URL and return 503 when `OPS_GATEWAY_URL` is not set (as documented in AGENT_TRACER.md).

### 7. Missing @Public() Decorators on Internal Controllers

**Files:**

- `apps/api/src/ops/ops.controller.ts` - Uses `OpsInternalGuard` but missing `@Public()`
- `apps/api/src/ops/gateway-proxy.controller.ts` - Uses `OpsInternalGuard` but missing `@Public()`

**Impact:** Double authentication - global `SupabaseAuthGuard` + `OpsInternalGuard`  
**Details:** AGENT_TRACER.md (2026-07-07) documents this was fixed, but the code doesn't show `@Public()` decorators.

---

## Code Quality Issues

### 8. Decorator Type Errors

**Files:** `access-control.controller.ts`, `admin.controller.ts`, `auth.controller.ts`  
**Impact:** TypeScript compilation errors  
**Details:** Multiple "Unable to resolve signature of method decorator" errors. This is likely due to:

- Incorrect decorator import syntax
- Missing `reflect-metadata` polyfill issues
- Potential version mismatch between NestJS and TypeScript

### 9. Inconsistent Database Access Patterns

**Files:**

- `admin.service.ts` - Uses `@repo/database` (Kysely)
- `admin.service.spec.ts` - Mocks Supabase client
- `webhooks.service.ts` - Uses `@repo/database` (Kysely)
- `db-audit.service.ts` - Uses Supabase client via RPC

**Issue:** Mixed data access patterns (Kysely vs Supabase client) with inconsistent test mocking.

### 10. Test File References Non-existent Module

**File:** `apps/api/src/admin/admin.service.spec.ts`  
**Issue:** Tests mock `SUPABASE_CLIENT` but the actual service uses `@repo/database` (Kysely). Tests will fail.

---

## Architecture Observations

### Positive Patterns

- ✅ Well-organized module structure (auth, ops, ai, control-room, etc.)
- ✅ Zod validation on all external inputs
- ✅ Global exception filter with Sentry integration
- ✅ Redis caching with L1/L2 strategy
- ✅ Rate limiting with ThrottlerModule
- ✅ Circuit breaker pattern for AI gateway
- ✅ Audit logging for admin operations
- ✅ Proper use of `@Public()` decorator for public endpoints

### Areas for Improvement

- ❌ Missing health check endpoints (controller exists but no implementation)
- ❌ No explicit error handling in `gateway-proxy.controller.ts` (returns 500 on any error)
- ❌ `AgentTriggerService` creates its own Redis instance instead of using shared `@repo/redis`
- ❌ `cacheWrap` in `ops.service.ts` uses 3-argument signature but `packages/redis/src/cache.ts` only supports 2 arguments

---

## Dependency Analysis

**File:** `apps/api/package.json`

### Key Dependencies

| Package                    | Version | Notes            |
| -------------------------- | ------- | ---------------- |
| `@nestjs/core`             | ^11.0.0 | Latest stable    |
| `@nestjs/platform-fastify` | ^11.0.0 | Fastify adapter  |
| `@nestjs/bullmq`           | ^11.0.0 | Queue processing |
| `zod`                      | ^4.4.3  | Validation (v4)  |
| `jsonwebtoken`             | ^9.0.2  | JWT handling     |
| `bcryptjs`                 | ^3.0.3  | Password hashing |
| `ioredis`                  | ^5.11.1 | Redis client     |

### Missing from workspace exports

- `nestjs.json` config is not exported (causes build failure)

---

## Recommendations

### Immediate (P0)

1. Add `"./nestjs.json": "./nestjs.json"` to `packages/typescript-config/package.json`
2. Create missing `apps/api/src/supabase/` module or update imports
3. Remove hardcoded JWT fallback secrets
4. Add `@Public()` decorators to `OpsController` and `GatewayProxyController`

### Short-term (P1)

5. Fix decorator type errors in controllers
6. Update `admin.service.spec.ts` to mock Kysely instead of Supabase
7. Remove default URL in `gateway-proxy.controller.ts` and return 503 when not configured
8. Add health check endpoints

### Medium-term (P2)

9. Standardize database access (choose Kysely or Supabase client consistently)
10. Add input validation to `ai.controller.ts` (currently accepts `any`)
11. Add proper error types using `@repo/errors`

---

## Files Analyzed

- `apps/api/src/main.ts` - Bootstrap and configuration
- `apps/api/src/app.module.ts` - Module imports
- `apps/api/src/auth/*` - Authentication (login, PIN, guards)
- `apps/api/src/ops/*` - Operations (cache, queue, rate limit, db audit)
- `apps/api/src/ai/*` - AI gateway and telemetry
- `apps/api/src/control-room/*` - Control room services
- `apps/api/src/admin/*` - Admin data management
- `apps/api/src/webhooks/*` - Webhook endpoints
- `apps/api/src/tools/*` - External tool health checks
- `apps/api/src/queue/*` - Background job processing
- `apps/api/src/access-control/*` - Badge scanner access control
- `apps/api/src/observability/*` - Metrics endpoint
- `apps/api/src/security/*` - CSP violation reports
- `apps/api/src/weather/*` - Weather API integration
- `apps/api/src/common/*` - Shared schemas and filters
- `apps/api/Dockerfile` - Container build
- `apps/api/.env.example` - Environment configuration
- `apps/api/package.json` - Dependencies
- `apps/api/tsconfig.json` - TypeScript configuration

---

## Next Steps

Run `pnpm install` after fixing the workspace exports, then re-run:

```bash
pnpm --filter api type-check
pnpm --filter api lint
pnpm --filter api test
```
