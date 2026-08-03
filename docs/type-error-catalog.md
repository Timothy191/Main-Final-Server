# TypeScript Error Catalog

_Permanent record of TypeScript errors found and fixed in the codebase.
Log errors here so the same mistake won't repeat._

## How to Use

When fixing a TypeScript error:

1. Check this catalog first to see if it's a known pattern
2. Apply the known fix strategy
3. Add new patterns here for future reference

## Error Patterns

### Pattern 1: `.js` extension imports with Turbopack

**Root Cause**: Turbopack doesn't resolve `.js` extensions to `.ts` source files.
TypeScript `moduleResolution: "bundler"` allows extensionless imports.

**Fix**: Use extensionless imports instead of `.js` extensions.

```typescript
// ❌ Wrong (breaks Turbopack):
export { cacheInvalidateTags } from './invalidation.js'

// ✅ Correct (works with both Turbopack and tsc):
export { cacheInvalidateTags } from './invalidation'
```

**Files fixed**: `packages/redis/src/index.ts`

---

### Pattern 2: Empty Zod schemas causing `{}` type inference

**Root Cause**: A Zod schema defined as `z.object({})` infers the TypeScript type as `{}`,
which means all property access returns `Property does not exist on type '{}'`.

**Fix**: Populate the Zod schema with proper field definitions.

```typescript
// ❌ Wrong (infers as `{}`):
export const updateWebhookSchema = z.object({})

// ✅ Correct (infers proper type):
export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  description: z.string().optional(),
})
```

**Files fixed**:

- `packages/contract/index.ts` — `syncPlaybackSchema`, `safetyExportQuerySchema`, `updateWebhookSchema`

---

### Pattern 3: `serverLogger()` returning `Console` without proper type

**Root Cause**: `serverLogger()` returned `console` directly, which has `() => Console` type.
Calling `logger.info(...)` on this function is a type error.

**Fix**: Create a proper `Logger` interface and return an object with typed methods.

```typescript
// ❌ Wrong (returns function, not object):
export function serverLogger() { return console; }

// ✅ Correct (returns object with methods):
interface Logger { info: (msg, ...args) => void; ... }
export function serverLogger(): Logger { return { info: ..., warn: ..., ... }; }
```

**Files fixed**:

- `packages/logger/index.ts` — Added proper `Logger` type with `info`, `warn`, `error`, `debug`
- `apps/portal/src/app/api/feedback/route.ts` — Changed import to call `serverLogger()` first
- `apps/portal/src/app/api/log/route.ts` — Changed import to call `serverLogger()` first

---

### Pattern 4: `new NextResponse()` with non-string body

**Root Cause**: `NextResponse` constructor expects `BodyInit` (string, Buffer, etc.)
but receiving an object or Map.

**Fix**: Serialize the data to a string before passing to `NextResponse`.

```typescript
// ❌ Wrong (passing object):
const metrics = await getMetrics();
return new NextResponse(metrics, ...);

// ✅ Correct (serialize first):
const metrics = await getMetrics();
const text = JSON.stringify(metrics, ...);
return new NextResponse(text, ...);
```

**Files fixed**: `apps/portal/src/app/api/metrics/prometheus/route.ts`

---

### Pattern 5: `cacheWrap()` called with extra arguments

**Root Cause**: The `cacheWrap` function signature is `(key, fn)` — 2 params.
Calling it with 3 params is a type error.

**Fix**: Remove the extra argument (or update the function signature).

```typescript
// ❌ Wrong:
await cacheWrap('key', fn, 60)

// ✅ Correct:
await cacheWrap('key', fn)
```

**Files fixed**: `apps/portal/src/app/api/tools/status/route.ts`

---

### Pattern 6: Unused imports in NestJS spec/source files

**Root Cause**: NestJS imports like `TestingModule`, `Inject` are imported but unused.

**Fix**: Remove unused imports. For NestJS, `@Injectable()` is sufficient for DI.

```typescript
// ❌ Wrong:
import { Test, TestingModule } from '@nestjs/testing'
import { Injectable, Inject } from '@nestjs/common'

// ✅ Correct:
import { Test } from '@nestjs/testing'
import { Injectable } from '@nestjs/common'
```

**Files fixed**:

- `apps/api/src/ai/ai-features.service.spec.ts` — Removed `TestingModule`
- `apps/api/src/auth/auth.service.ts` — Removed unused `Inject`
- `apps/api/src/ops/gateway-proxy.controller.ts` — Removed unused `Inject`

---

### Pattern 7: Unused caught error variable

**Root Cause**: `catch (err)` where `err` is never used.

**Fix**: Use `catch` without the variable.

```typescript
// ❌ Wrong:
} catch (err) { return { status: "fallback" }; }

// ✅ Correct:
} catch { return { status: "fallback" }; }
```

**Files fixed**: `apps/api/src/ai-bridge/ai-bridge.service.spec.ts`

---

### Pattern 8: Unused function parameter

**Root Cause**: Function parameter declared but never used in the body.

**Fix**: Remove the parameter name or prefix with `_`.

```typescript
// ❌ Wrong (parameter causes lint warning):
.mockImplementation((table: string) => makeThenable({ data: [] }));

// ✅ Correct (remove unused parameter):
.mockImplementation(() => makeThenable({ data: [] }));
```

**Files fixed**: `apps/api/src/admin/admin.service.spec.ts` — Removed unused `table` arg

---

### Pattern 9: Missing metric exports in observability module

**Root Cause**: Test imports functions that don't exist in the module (`clearObservabilityMetrics`),
or function signatures don't match usage (`recordDbQuery` params).

**Fix**: Add missing exports and fix function signatures to match usage.

```typescript
// ❌ Wrong:
export function recordDbQuery(key: string, durationMs: number, success: boolean) { ... }
// Missing: clearObservabilityMetrics

// ✅ Correct:
export function recordDbQuery(table: string, operation: string, durationMs: number, success: boolean) { ... }
export function clearObservabilityMetrics(): void { ... }
```

**Files fixed**: `apps/portal/src/lib/observability/metrics.ts`

---

### Pattern 10: `redis.isOpen` type assertion

**Root Cause**: `ioredis.Redis` type doesn't include `isOpen` property (it's a runtime property).

**Fix**: Use a type assertion with `Record<string, boolean>`.

```typescript
// ❌ Wrong:
redisConnected = redis.isOpen ?? false

// ✅ Correct:
redisConnected = (redis as Record<string, boolean>).isOpen ?? false
```

**Files fixed**: `apps/portal/src/app/api/health/cache/route.ts`
