---
name: agent-caching
description: Permanent agent rules, patterns, and verification procedures for L1/L2 Redis caching, Next.js 16 "use cache" tags, edge proxy auth caching, and cache invalidation.
---

# Agent Caching Skill

Use this skill when reading, writing, or invalidating cached data in `apps/portal`, `@repo/redis`, `@repo/supabase`, or edge middleware (`proxy.ts`).

## 1. Architectural Caching Rules

1. **Edge Auth Cache Coherence (ADR-001):**
   - Edge proxy (`apps/portal/src/proxy.ts`) caches employee roles in Redis L2 (`arch:auth:employee:<userId>`) with a 300s TTL and L1 in-process map for 30s.
   - Any mutation modifying an employee's role or department entitlements **MUST** call `POST /api/cache/invalidate { userId }` or execute `cacheDelete('arch:auth:employee:<userId>')` to clear both L1 and L2 immediately across all pods.

2. **Next.js 16 `"use cache"` Boundary Rule:**
   - **Outer Un-cached Function:** Perform authentication/authorization check (`assertDeptRole` or `createServerSupabaseClient`).
   - **Inner Cached Function:** Annotate with `"use cache"`, set `cacheLife('5 minutes')`, tag with `cacheTag(...)`, and retrieve data using `createAdminClient()`.
   - **CRITICAL:** **NEVER** read `cookies()`, `headers()`, or user-specific request context inside `"use cache"` scopes.

3. **Two-Tier Redis (L1 + L2) Invalidation:**
   - Always use `@repo/redis/cache` helper functions (`cacheGet`, `cacheSet`, `cacheWrap`, `cacheDelete`, `cacheInvalidateTags`).
   - Use `CacheCategory` from `@repo/redis` (`CONTROL_ROOM`, `DRILLING`, `PRODUCTION`, `SAFETY`, `SATELLITE`, `ENVIRONMENT`, `LOGISTICS`, `GEOLOGY`, `AUTH`, `METRICS`, `SHIFT`).
   - Use `DEPARTMENT_CACHE_TAGS` from `@/lib/department-cache`:
     - Department Tags: `dept:control-room`, `dept:drilling`, `dept:production`, etc.
     - Table Tags: `table:hourly_loads`, `table:machine_operations`, `table:excavator_activity`, `table:engineering_notes`, `table:daily_logs`, `table:machines`, `table:breakdowns`, `table:safety_incidents`.

---

## 2. Standard Caching Implementation Pattern

```typescript
import { cacheLife, cacheTag } from 'next/cache'
import { createAdminClient } from '@repo/supabase/server'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

// 1. Uncached outer function handles Auth & Role check
export async function getDepartmentData(deptSlug: string, user: Employee) {
  assertDeptRole(['admin', 'operator'], deptSlug)

  // 2. Delegate to inner cached function
  return fetchDepartmentDataCached(deptSlug)
}

// 3. Inner function uses "use cache" with admin client
async function fetchDepartmentDataCached(deptSlug: string) {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(DEPARTMENT_CACHE_TAGS.DRILLING, `dept:${deptSlug}`)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('department_slug', deptSlug)

  if (error) throw error
  return data
}
```

---

## 3. Invalidation & Cache Eviction Pattern

```typescript
import { revalidateTag } from 'next/cache'
import { cacheDelete } from '@repo/redis/cache'

export async function handleRoleOrDepartmentUpdate(targetUserId: string, newRole: string) {
  // 1. Database update
  await updateEmployeeRoleInDb(targetUserId, newRole)

  // 2. Immediate L1 + L2 Auth Cache Eviction (ADR-001)
  await cacheDelete(`arch:auth:employee:${targetUserId}`)

  // 3. Revalidate Next.js Data Cache tags
  revalidateTag('table:employees')
}
```

---

## 4. Verification Checklist

- [ ] Un-cached outer wrapper performs auth check (`cookies()` / `headers()` access stays outside `"use cache"`).
- [ ] Inner function tagged with standard `DEPARTMENT_CACHE_TAGS`.
- [ ] User role changes evict both L1 and L2 via `cacheDelete(`arch:auth:employee:${userId}`)`.
- [ ] Tested with `pnpm --filter portal test -- path/to/cache.test.ts`.
