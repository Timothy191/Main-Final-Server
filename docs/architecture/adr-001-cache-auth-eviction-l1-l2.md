# ADR-001: Evict Both L1 and L2 on a Role / Department Change

**Status:** Proposed
**Date:** 2026-08-03
**Deciders:** Platform lead, portal auth/proxy owner, on-call ops

## Context

The edge proxy (`apps/portal/src/proxy.ts` → `resolveEmployee`) is the
authoritative gate for role and department-route access. It resolves a user's
role from the `employees` table **once** and caches the result:

- **Cache key:** `arch:auth:employee:<userId>` (`userId` = Supabase `auth.users.id`)
- **L2 (Redis) TTL:** 300s (`cacheSet(..., 300)`)
- **L1 (in-process) TTL:** 30s (`cacheSet` clamps L1 to `min(ttl, 30)`; an L2
  hit re-populates L1 for 15s via `cacheGet`)

So after a role or department-access change, the proxy can keep authorizing on
the **old** role for up to 5 minutes.

The existing eviction hook — `POST /api/cache/invalidate { userId }` in
[`apps/portal/src/app/api/cache/invalidate/route.ts`](../../apps/portal/src/app/api/cache/invalidate/route.ts)
— calls `cacheEvictL1ByPrefix` from
[`@repo/redis/cache`](../../packages/redis/src/cache.ts). That function is
**L1-only**: `memoryDeleteByPrefix(prefix)` clears the in-process map and
nothing more. It does **not** call `redis.del`, so the Redis L2 key persists for
its full 300s TTL. Worse, `cacheGet` re-populates L1 from a stale L2 hit, so even
the pod that handled the eviction re-caches the old role within one request.

Two further gaps compound this:

1. **No caller is wired.** The admin role-change flow does not yet call the
   invalidation endpoint with the _target_ user's id (the `AGENT-TRACE` in the
   route flags this). Today the endpoint exists but is never invoked on a role
   change, so even the L1 eviction never runs automatically.
2. **Multi-pod asymmetry.** L1 is per-pod; even a correct L1 eviction only
   clears the pod that handled the POST. Without an L2 delete, other pods keep
   serving stale data until the 300s L2 TTL lapses.

Constraints the decision must honor:

- `proxy.ts` runs in the **edge** runtime; it cannot use the async Redis client.
  The invalidation **route** runs in **node** and can.
- The `employees` table is the source of truth (CLAUDE.md / AGENTS.md). The
  cache is purely a performance shim; correctness must rest on re-reading
  `employees`.
- `@repo/redis/cache` already exports `cacheDelete(key)` (does
  `memoryDelete` + `redis.del`) and `cacheDeletePattern(pattern)` (does
  `memoryDeleteByPrefix` + `cacheInvalidatePrefixes`). No new cache primitive is
  needed.
- RLS is enforced; the invalidation route already requires an authenticated
  session (`auth.getUser`). The role-change caller must be an admin.

## Decision

Close the gap in two coordinated changes:

1. **Upgrade the invalidation route to evict L1 _and_ L2.** When `userId` is
   present, in addition to `cacheEvictL1ByPrefix`, call `cacheDelete` (or
   `cacheDeletePattern`) on the same key so the Redis L2 record is deleted
   immediately. The route is node-runtime and already imports from
   `@repo/redis/cache`, so this is additive and edge-safety is unaffected.
2. **Wire the admin role-change flow to call the endpoint with the target
   user's id.** The role-change server action / mutation must `POST
/api/cache/invalidate { userId: <changed-user's-id> }` (or call
   `cacheEvictL1ByPrefix` + `cacheDelete` server-side directly) as part of the
   same change that writes the `employees` row.

Keep the 300s L2 TTL unchanged — it exists to protect the hot auth path, and the
explicit eviction makes it a worst-case backstop rather than the primary
freshness mechanism.

## Options Considered

### Option A: Status quo + manual `redis-cli DEL` (runbook-only)

| Dimension        | Assessment                                          |
| ---------------- | --------------------------------------------------- |
| Complexity       | Low — no code change; document the manual procedure |
| Cost             | Operator time on every role change; easy to forget  |
| Scalability      | Poor — manual, human-gated, multi-step              |
| Team familiarity | High — operators already use `redis-cli`            |

**Pros:** Zero code risk; ships now.
**Cons:** Relies on an operator remembering a multi-step procedure for every
role change; the endpoint's L1-only behavior is a footgun that stays latent;
the unwired caller gap stays open. This is the documented interim state in
[`../runbooks/evict-employee-auth-cache.md`](../runbooks/evict-employee-auth-cache.md).

### Option B (chosen): Route evicts L1 + L2; admin flow calls it

| Dimension        | Assessment                                                      |
| ---------------- | --------------------------------------------------------------- |
| Complexity       | Low–Med — one extra cache call in the route + one caller wiring |
| Cost             | Negligible — one `redis.del` per role change                    |
| Scalability      | Good — automatic, cross-pod via the shared L2                   |
| Team familiarity | High — uses existing `@repo/redis/cache` primitives             |

**Pros:** Automatic; immediate cross-pod freshness; reuses existing primitives;
edge runtime untouched; the endpoint already exists.
**Cons:** Two code changes must land together (route + caller) or the route
upgrade is inert. Requires the admin caller to know the target user's id.

### Option C: Lower the L2 TTL from 300s to ~30s

| Dimension        | Assessment                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| Complexity       | Low — one constant                                                        |
| Cost             | Higher `employees` read load (10× more cache misses on the hot auth path) |
| Scalability      | Poor — shifts the staleness window down but does not eliminate it         |
| Team familiarity | High                                                                      |

**Pros:** Trivial change; bounds staleness without any caller wiring.
**Cons:** Does not give immediacy (still up to 30s stale); increases DB read
load on the hottest path; the unwired-caller and L1-only-eviction footguns
remain. Reject as a primary fix; keep as an optional secondary guard.

## Trade-off Analysis

Option A is honest about the gap but permanently offloads correctness to a
human runbook — unacceptable for an auth-critical path that changes in
production. Option C trades hot-path performance for a smaller-but-nonzero
staleness window and leaves the real bug (L1-only eviction + no caller) in
place. **Option B is the only option that makes correctness automatic and
cross-pod** while reusing primitives that already exist and keeping the edge
runtime free of async Redis calls. Its only real cost is coordination: the
route upgrade and the caller wiring must ship together, which is a process
constraint, not an architectural one.

## Consequences

- **What becomes easier:** A role or department change is reflected at the next
  request, on every pod, with no operator intervention. The runbook demotes
  from "run on every change" to "fallback if the automatic path fails."
- **What becomes harder:** The invalidation route gains an async Redis
  dependency on the `userId` path (it already has one for the tag path via
  `revalidateTag`, so this is consistent). Tests for the route must cover the
  L2-delete branch.
- **What we'll need to revisit:** If the admin role-change flow moves to a
  Supabase trigger / database webhook rather than a portal server action, the
  caller must be re-wired to that trigger (the route contract —
  `POST { userId }` — stays stable). If Redis is frequently unavailable during
  role changes, an L1-only eviction + short TTL (Option C) may be revisited as
  a degraded-mode guard.

## Action Items

1. [ ] In `apps/portal/src/app/api/cache/invalidate/route.ts`, add an L2 delete
       (`cacheDelete` / `cacheDeletePattern` on `arch:auth:employee:<userId>`)
       alongside the existing `cacheEvictL1ByPrefix` on the `userId` path.
2. [ ] Wire the admin role-change mutation (and department-access grant/revoke)
       to call `POST /api/cache/invalidate { userId }` with the **target** user's
       id, in the same change that writes the `employees` row.
3. [ ] Add a unit test covering the L2-delete branch of the invalidation route.
4. [ ] Update [`../runbooks/evict-employee-auth-cache.md`](../runbooks/evict-employee-auth-cache.md)
       — once actions 1–2 land, demote the manual `redis-cli DEL` step from
       "required for multi-pod" to "fallback / debugging" and note the route now
       evicts L1 + L2.
5. [ ] Append a REPO-CHANGE-INDEX row when the implementation lands; flip this
       ADR's status to **Accepted**.
