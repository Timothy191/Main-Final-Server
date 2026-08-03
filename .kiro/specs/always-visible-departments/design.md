# Design: Always-Visible Departments

## Architecture

- **Catalog**: `DEPARTMENTS` remains the full static catalog.
- **ACL resolve**: `resolveAccessibleDepartmentNames` unchanged (UUID → name list).
- **Hub mapping**: `departmentsForHub` returns every catalog entry with `accessible: boolean` = ACL name match ∩ role gate (`isDeptAllowedForRole`).
- **UI**: `DepartmentCard` and `BottomNav` accept `accessible`; when false → `cursor-not-allowed`, `aria-disabled`, no navigation.
- **Server gate**: `proxy.ts` unchanged — deep links still denied for unauthorized users.
- **Owner account**: Migration ensures `timothyoniel558@gmail.com` employee is `admin` with all department UUIDs in `accessible_departments`.

## Files

| File                                                         | Change                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `apps/portal/src/lib/accessible-departments.ts`              | Always return full catalog + `accessible` flag                       |
| `apps/portal/src/app/hub/page.tsx`                           | Pass `accessible` into cards; drop empty-ACL empty state for catalog |
| `apps/portal/src/features/hub/components/DepartmentCard.tsx` | Locked UX                                                            |
| `apps/portal/src/components/nav/BottomNav.tsx`               | Always show items; locked cursor                                     |
| `apps/portal/src/app/hub/layout.tsx`                         | Pass accessible names (already)                                      |
| Tests for card/nav/lib                                       | Cover locked vs open                                                 |
| `packages/database/migrations/074_*.sql` (+ supabase mirror) | Ensure owner full access                                             |

## Boundaries

- Client components only receive booleans/names — no service-role.
- No new dependencies.
