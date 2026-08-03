/**
 * Shared department route / role-gate constants.
 * Used by hub UI filters and kept in sync with apps/portal/proxy.ts ACL.
 * AGENT-TRACE: Single source for restricted dept roles so hub cards match proxy denials.
 */

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
] as const

export type DepartmentRouteSlug = (typeof DEPARTMENT_ROUTE_SLUGS)[number]

/** Role allowlists matching proxy RESTRICTED_ROUTES (dept segments only). */
export const RESTRICTED_DEPT_ROLES: Record<string, readonly string[]> = {
  'access-control': ['access_control', 'admin'],
  'control-room': ['control_room_operator', 'admin'],
  admin: ['admin'],
}

export function isDeptAllowedForRole(deptSlug: string, role: string): boolean {
  const allowed = RESTRICTED_DEPT_ROLES[deptSlug]
  if (!allowed) return true
  return allowed.includes(role)
}

export function filterDepartmentsByRole<T extends { name: string }>(
  departments: readonly T[],
  role: string
): T[] {
  return departments.filter((d) => isDeptAllowedForRole(d.name, role))
}
