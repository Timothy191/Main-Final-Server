# Code Duplication Audit

## Summary

The code duplication audit across department action files reveals significant repetition in authentication helper functions. The following patterns were identified:

### Repeated Auth Helper Functions

- `assertAccessCardActionsRole()` in `apps/portal/src/app/(departments)/access-card-actions/actions.ts`
- `assertAccessControlRole()` in `apps/portal/src/app/(departments)/access-control/actions.ts`
- `assertControlRoomRole()` in `apps/portal/src/app/(departments)/control-room/actions.ts`
- `assertProductionRole()` in `apps/portal/src/app/(departments)/production/actions.ts`
- `assertSafetyRole()` in `apps/portal/src/app/(departments)/safety/actions.ts`
- `assertSatelliteRole()` in `apps/portal/src/app/(departments)/satellite-monitoring/actions.ts`

All functions perform identical steps:

1. Import `createServerSupabaseClient` from `@repo/supabase/server`
2. Create Supabase client instance
3. Verify user authentication via `supabase.auth.getUser()`
4. Return 401 error if unauthenticated
5. Query `employees` table for role/department information

### Recommended Solution

Create a shared authentication utility in `@repo/lib/auth` to consolidate these repeated patterns. This would:

- Reduce code duplication by ~80 lines
- Centralize authentication logic
- Improve maintainability
- Ensure consistent error handling

### Files Analyzed

- `apps/portal/src/app/(departments)/access-card-actions/actions.ts`
- `apps/portal/src/app/(departments)/access-control/actions.ts`
- `apps/portal/src/app/(departments)/control-room/actions.ts`
- `apps/portal/src/app/(departments)/production/actions.ts`
- `apps/portal/src/app/(departments)/safety/actions.ts`
- `apps/portal/src/app/(departments)/satellite-monitoring/actions.ts`

## Recommendations

1. Extract shared authentication logic to `@repo/lib/auth`
2. Update department actions to import and use the shared utility
3. Add unit tests for the shared authentication utility
