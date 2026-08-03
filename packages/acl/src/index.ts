/**
 * @repo/acl — Canonical access-control list for Arch Systems.
 *
 * Single source of truth for department route slugs, restricted route→role
 * allowlists, the Role type, and the pure route-permission predicates.
 *
 * Consumed by BOTH the edge runtime (`apps/portal/src/proxy.ts`) and node
 * server actions (`apps/portal/src/lib/dept-access.ts`). Importing from here
 * instead of redefining the maps inline is what keeps the two runtimes from
 * drifting — the old inline copies had already diverged (proxy had a `tools`
 * key that dept-access lacked).
 *
 * AGENT-TRACE: This package is edge-safe — pure data and pure functions only.
 * No Node APIs, no `server-only`, no Supabase imports. The live `employees`
 * lookup (`assertDeptRole`) stays in `dept-access.ts` because it needs a
 * server Supabase client; only the ACL *data* and *predicates* live here.
 */

/** Known employee roles. Open-ended via `(string & {})` so unknown roles
 *  don't break the type — same escape-hatch pattern as `@repo/errors` ErrorCode. */
export type Role =
  | 'admin'
  | 'manager'
  | 'supervisor'
  | 'operator'
  | 'access_control'
  | 'control_room_operator'
  | (string & {})

/** Every department route segment the portal serves. */
export const DEPARTMENT_ROUTE_SLUGS = [
  'drilling',
  'production',
  'access-control',
  'access-card-actions',
  'engineering',
  'control-room',
  'safety',
  'training',
  'satellite-monitoring',
  'environment',
  'logistics-fleet',
  'geology',
] as const

export type DepartmentRouteSlug = (typeof DEPARTMENT_ROUTE_SLUGS)[number]

/**
 * Route→role allowlists. A route listed here is restricted to the given roles.
 * Routes *not* listed are open to any authenticated employee (department
 * membership is still checked separately at `isDepartmentAllowed`).
 *
 * Keys include both department segments (`access-control`, `control-room`) and
 * the cross-department `tools` second-segment and `admin` prefix. This is the
 * union of the two former inline maps; the `tools` key had been lost in the
 * `dept-access.ts` copy.
 */
export const RESTRICTED_DEPT_ROLES: Record<string, readonly Role[]> = {
  'access-control': ['access_control', 'admin'],
  'control-room': ['control_room_operator', 'admin'],
  tools: ['admin', 'supervisor'],
  admin: ['admin'],
}

/** Normalize an unknown role value to a non-empty string, defaulting to `operator`. */
export function normalizeRole(role: unknown): Role {
  return typeof role === 'string' && role.length > 0 ? role : 'operator'
}

/** True if `role` is allowed on the restricted `deptSlug`; unrestricted slugs pass. */
export function isDeptAllowedForRole(deptSlug: string, role: Role): boolean {
  const allowed = RESTRICTED_DEPT_ROLES[deptSlug]
  if (!allowed) return true
  return allowed.includes(role)
}

/**
 * Restricted-route predicate (edge + node). Mirrors the former
 * `proxy.ts` `isRestrictedRouteAllowed`: any restricted prefix whose allowlist
 * excludes `role` fails; the `tools` second-segment is checked separately.
 */
export function isRestrictedRouteAllowed(
  pathname: string,
  secondSegment: string | undefined,
  role: Role
): boolean {
  for (const [route, allowedRoles] of Object.entries(RESTRICTED_DEPT_ROLES)) {
    if (pathname.startsWith(`/${route}`) && !allowedRoles.includes(role)) {
      return false
    }
  }

  if (secondSegment === 'tools' && !isDeptAllowedForRole('tools', role)) {
    return false
  }

  return true
}

/** Filter a list of departments (by `name`) to those `role` may see. */
export function filterDepartmentsByRole<T extends { name: string }>(
  departments: readonly T[],
  role: Role
): T[] {
  return departments.filter((d) => isDeptAllowedForRole(d.name, role))
}
