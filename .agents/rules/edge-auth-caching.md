# Agent Rule: Edge Auth & Data Caching (ADR-001)

When working on caching, edge middleware, auth state, or department data fetching in `apps/portal` or `@repo/redis`:

1. **Edge Auth Cache Coherence (L1 + L2):**
   - Edge proxy (`apps/portal/src/proxy.ts` → `resolveEmployee`) caches user roles in Redis L2 (`arch:auth:employee:<userId>`) for 300s.
   - Any role/department mutation **MUST** evict both L1 (in-process) and L2 (Redis) using `cacheDelete('arch:auth:employee:<userId>')` or calling `POST /api/cache/invalidate { userId }`.

2. **Next.js 16 `"use cache"` Boundary Rule:**
   - Auth & permission checks must execute in an un-cached outer function.
   - Inner cached functions must use `"use cache"`, `cacheLife('5 minutes')`, and `cacheTag(...)`.
   - Never access `cookies()`, `headers()`, or dynamic request headers inside `"use cache"` scopes.

3. **Tag Invalidation Contract:**
   - Invalidate cache tags using `revalidateTag(DEPARTMENT_CACHE_TAGS.<TAG>)`.
   - Never manually wipe L2 Redis without updating L1 in-memory state.

## Related Skill

- [`.agents/knowledge/skills/agent-caching/SKILL.md`](../.agents/knowledge/skills/agent-caching/SKILL.md) — full patterns, verification checklist, and reusable tokens.
