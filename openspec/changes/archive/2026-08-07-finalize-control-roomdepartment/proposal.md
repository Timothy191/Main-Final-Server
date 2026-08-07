## Why

The control-room department's finalization work was incomplete and uncommittable: a new client-side telemetry/dashboard cache hook (`useControlRoomCache`) and its test were being silently excluded from version control by an overly broad bare `hooks/` ignore pattern, and the SMR metrics flow in the machine-operations actions needed alignment with the async data layer. The department could not be considered finalized until the caching behavior was specified, the ignore bug fixed, and the change landed in a validated state.

## What Changes

- Add a client-side in-memory cache for control-room telemetry and dashboard data (`useControlRoomCache`) with TTL expiry and tag-based invalidation (`invalidateClientCacheByTags`).
- Prevent infinite re-fetch/re-render loops when fetcher functions or options are recreated between renders by stabilizing them in refs.
- Scope the bare `hooks/` ignore rule in `.gitignore` and `.claudeignore` to `.claude/hooks/`, restoring `apps/portal/src/hooks/` product code to version control.
- Align `calculateSmrMetrics` with the async action flow (awaited at the call site; output contract unchanged).

## Capabilities

### New Capabilities

- `control-room-client-cache`: Client-side caching of control-room telemetry/dashboard data with TTL expiry and tag-based invalidation.

### Modified Capabilities

- (none — the SMR metrics output contract is unchanged; the async alignment is implementation detail and does not alter observable behavior)

## Impact

- `apps/portal/src/hooks/useControlRoomCache.ts` (+ `useControlRoomCache.test.ts`) — new client hook with TTL + tag invalidation.
- `apps/portal/src/app/(departments)/control-room/components/SCADAAlertFeed.tsx` — consumes the client cache.
- `apps/portal/src/app/(departments)/control-room/actions.ts` (+ `actions.test.ts`) — `calculateSmrMetrics` aligned to async flow.
- `.gitignore` / `.claudeignore` — `hooks/` scoped to `.claude/hooks/`.
