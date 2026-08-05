# @repo/acl — Specification

Canonical Access-Control List (ACL) single source of truth for Arch System department route slugs, role definitions, and edge-safe permission predicates.

## 1. Overview & Architecture

`@repo/acl` defines the authoritative access control rules for the entire platform. It is designed to be **strictly edge-safe** (zero Node.js dependencies, zero DOM assumptions, zero database calls).

- **Execution Context:** Next.js 16 Edge Proxy (`apps/portal/src/proxy.ts`) and Node.js Server Actions / API routes (`apps/portal/src/lib/dept-access.ts`).
- **Design Goal:** Eliminate permission drift between edge middleware and server-side route guards.

---

## 2. Exported Specification

### 2.1 Types & Constants

| Symbol                   | Type / Value                                                                                                                                                                                             | Description                                      |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| `Role`                   | `'admin' \| 'manager' \| 'supervisor' \| 'operator' \| 'access_control' \| 'control_room_operator' \| (string & {})`                                                                                     | Employee role union with string escape hatch     |
| `DEPARTMENT_ROUTE_SLUGS` | `readonly ['drilling', 'production', 'access-control', 'access-card-actions', 'engineering', 'control-room', 'safety', 'training', 'satellite-monitoring', 'environment', 'logistics-fleet', 'geology']` | Tuple of valid department route segments         |
| `DepartmentRouteSlug`    | `(typeof DEPARTMENT_ROUTE_SLUGS)[number]`                                                                                                                                                                | Type union of department route segments          |
| `RESTRICTED_DEPT_ROLES`  | `Record<string, readonly Role[]>`                                                                                                                                                                        | Map of restricted route slugs to role allowlists |

### 2.2 Restricted Route Map

```typescript
export const RESTRICTED_DEPT_ROLES: Record<string, readonly Role[]> = {
  'access-control': ['access_control', 'admin'],
  'control-room': ['control_room_operator', 'admin'],
  tools: ['admin', 'supervisor'],
  admin: ['admin'],
}
```

### 2.3 Methods & Predicates

#### `normalizeRole(role: unknown): Role`

Normalizes any unknown input into a valid `Role` string, falling back to `'operator'` if empty or non-string.

#### `isDeptAllowedForRole(deptSlug: string, role: Role): boolean`

Checks if `role` is permitted for `deptSlug`. Unrestricted department slugs automatically return `true`.

#### `isRestrictedRouteAllowed(pathname: string, secondSegment: string | undefined, role: Role): boolean`

Pure route-permission evaluator consumed by edge middleware. Checks top-level path prefixes against `RESTRICTED_DEPT_ROLES` and handles second-segment gates (e.g. `/control-room/tools`).

#### `filterDepartmentsByRole<T extends { name: string }>(departments: readonly T[], role: Role): T[]`

Filters an array of department objects based on the user's role.

---

## 3. Security & Constraints

1. **Edge Safety Constraint:** No imports from `@supabase/supabase-js`, `server-only`, or Node native modules.
2. **Open-Ended Role Pattern:** `(string & {})` prevents TypeScript breaks on newly added roles while maintaining autocompletion for standard roles.
3. **SSOT Rule:** No department slug literals or role strings may be hardcoded inside `apps/portal`. All must reference `@repo/acl`.

---

## 4. Dependencies

- `devDependencies`: `@repo/typescript-config`, `typescript`
- `dependencies`: None
