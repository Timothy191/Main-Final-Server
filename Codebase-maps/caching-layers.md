# Caching Architecture & Mesh Map

## 1. Overview

The **Arch Systems Portal** implements a high-performance multi-tier caching architecture combining **Next.js 16 native Cache Components (`"use cache"`)** and `@repo/redis`, a **hybrid L1/L2 cache mesh**.

---

## 2. Multi-Tier Caching Architecture

```text
[ Incoming Request ]
         │
         ▼
[ Next.js 16 "use cache" Layer ] ── Tagged via cacheTag()
         │  (Cache miss)
         ▼
[ @repo/redis Hybrid Cache Mesh ]
   ├── Tier 1 (L1): Local Node.js RAM Memory Map
   │     ├── Max Capacity: 1,000 entries
   │     ├── Eviction: LRU (Least Recently Used)
   │     └── Default TTL: 15 seconds
   │
   └── Tier 2 (L2): Redis Cluster / Instance
         ├── Distributed persistence across portal instances
         └── Invalidation via Redis Pub/Sub & Key Tags
         │
         ▼ (Cache miss)
[ Supabase PostgreSQL Database ]
```

---

## 3. Next.js 16 Caching Rules & Auth Decoupling Protocol

### Mandatory Caching Rule

> **NEVER read `cookies()` or `headers()` inside a `"use cache"` scope.**  
> Doing so causes Next.js 16 build/runtime errors or dynamic request contagion. This rule applies to both direct calls and indirect helpers like `createServerSupabaseClient()` or `assertAccessControlRole()`.

### Auth Decoupling Pattern

To cache department or global site data securely, all data-fetching routines must be decoupled into two distinct functions:

```text
  Outer Function (Un-cached)
  ├── 1. Reads user session cookies / headers via createServerSupabaseClient()
  ├── 2. Asserts access control role & permissions (assertAccessControlRole)
  └── 3. Invokes Inner Cached Function
               │
               ▼
  Inner Function ("use cache" Scope)
  ├── 1. Declares "use cache" directive
  ├── 2. Applies cacheTag('department-data', departmentId)
  └── 3. Fetches data using createAdminClient() (Service Role / Cookie-free)
```

### Code Example Pattern

```typescript
// 1. Inner cached fetcher — zero cookie access, uses createAdminClient
async function _getCachedDepartmentMetrics(departmentId: string) {
  'use cache'
  cacheTag('department-metrics', `dept-${departmentId}`)

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('department_metrics')
    .select('*')
    .eq('department_id', departmentId)

  if (error) throw new InternalError('Failed to fetch metrics')
  return data
}

// 2. Outer un-cached boundary — verifies authorization before calling inner cached function
export async function getDepartmentMetrics(departmentId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError('Authentication required')

  await assertAccessControlRole(user.id, departmentId)
  return _getCachedDepartmentMetrics(departmentId)
}
```

---

## 4. Cache Invalidation & Management Operations

### Invalidation Mechanisms

1. **Tag Invalidation (`cacheTag`)**:
   - `revalidateTag("department-metrics")` invalidates Next.js 16 cached entries tagged with `"department-metrics"`.
   - `cacheInvalidateTags(["dept-engineering"])` purges matching L1 memory and L2 Redis entries.

2. **Programmatic Cache Purge API (`/api/ops/cache/clear`)**:
   - `POST /api/ops/cache/clear` purges local L1 RAM caches and sends invalidation broadcasts across Redis cluster nodes.

3. **L1 LRU Eviction**:
   - Local L1 in-memory cache enforces `L1_MAX_ENTRIES = 1000`. When limit is reached, oldest entries are evicted automatically.
