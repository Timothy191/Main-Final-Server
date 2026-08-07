# Next-System Workflow Rule

## Purpose
When completing a workflow on one system or package, always suggest the next logical system to work on in the Arch-System dependency chain.

## Trigger
After completing any implementation, fix, or review task on a specific package/system, suggest the next system before ending the session.

## Next-System Routing

| Completed System | Suggest Next System | Reason |
|-----------------|---------------------|--------|
| `@repo/redis` (caching) | `@repo/supabase` (database) | Cached data is read from DB; verify DB layer next |
| `@repo/supabase` | `@repo/acl` (auth/ACL) | DB queries should respect department ACL |
| `@repo/acl` | `packages/contract` (Zod schemas) | ACL rules need validation contracts |
| `packages/contract` | `@repo/redis` (caching) | Validated data should be cached |
| `apps/portal` (frontend) | `@repo/ui` (shared components) | Portal UI uses shared components |
| `@repo/ui` | `@repo/theme` (design tokens) | Components consume design tokens |
| `@repo/theme` | `apps/portal` | Tokens are consumed by the portal |
| Any package | `docs/REPO-CHANGE-INDEX.md` | Always update the change log |

## Behavior
1. After task completion, list what was fixed/changed
2. Suggest the next system with a one-line rationale
3. Ask if the user wants to continue with the next system or stop

## Example Output
```
✅ cacheDeletePattern fix complete.
Tests pass. Change logged in REPO-CHANGE-INDEX.md.

Next system: @repo/supabase (database)
Rationale: Cached invalidation patterns often correspond to DB query patterns; verify the data layer handles the same keys correctly.

Continue with @repo/supabase, or stop here?
```
