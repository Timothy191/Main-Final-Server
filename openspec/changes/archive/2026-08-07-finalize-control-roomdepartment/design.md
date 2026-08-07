## Context

See proposal.md — Why. The control-room dashboard (SCADA alert feed) polls telemetry and needed a client-side cache to dedupe requests; the repository already has L1/L2 server-side caching (`@repo/redis`), but browser-side data needed an in-memory store scoped per client session. The bare `hooks/` pattern in the ignore files predated the portal's `src/hooks/` directory and silently dropped new files added there.

## Goals / Non-Goals

**Goals:**

- Client-side TTL cache with tag-based eviction, mirroring the server-side tag-invalidation mental model.
- Protect against infinite render loops when fetcher/options arguments are volatile.
- Restore `apps/portal/src/hooks/` product code to version control.

**Non-Goals:**

- Persisting the cache across sessions (no localStorage/IndexedDB).
- Cross-client cache sharing (per-session in-memory only).
- Changing the SMR metrics output contract (async alignment only).

## Decisions

1. **Module-level `Map` cache store** — a single in-memory `Map` keyed by cache key serves all hook consumers, with per-entry `expiresAt` and `tags`. Alternative (per-component state) rejected: no cross-consumer dedupe and no tag invalidation.
2. **Tag invalidation mirroring `@repo/redis` tags** — `invalidateClientCacheByTags` matches the server-side tag contract so future revalidation can invalidate both layers with the same tags.
3. **`useRef` stabilization of fetcher/options** — volatile parameters are stored in refs so the effect depends only on the key, preventing refetch/re-render loops.
4. **Scoped ignore rule** — `hooks/` → `.claude/hooks/` in both `.gitignore` and `.claudeignore` (kept in sync per `guard:ignoresync`); the intended target was harness runtime hook state only.
5. **Async SMR metrics** — `calculateSmrMetrics` is awaited at the call site inside the cached machine-ops fetcher; the output shape is unchanged, keeping tests focused on the contract.

## Risks / Trade-offs

- [Stale data between TTL refresh cycles] → Mitigated by TTL plus tag invalidation, matching server-side semantics.
- [Unbounded cache growth] → Bounded by per-session scope and TTL eviction; acceptable for a fixed set of telemetry keys.
- [Ignore-scope regressions] → `guard:ignoresync` and `git status --ignored` checks catch future mis-scoping.
