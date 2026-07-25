/**
 * Shared department route / role-gate constants and auth helpers.
 * Used by hub UI filters, server actions, and kept in sync with apps/portal/proxy.ts ACL.
 * AGENT-TRACE: Single source for restricted dept roles so hub cards match proxy denials.
 */

import { AuthError, ForbiddenError } from '@/lib/errors/error-classes'
import type { SupabaseClient } from '@supabase/supabase-js'

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

/* ------------------------------------------------------------------ */
/*  Auth helper — shared across all department server actions          */
/* ------------------------------------------------------------------ */

export interface RoleAuthResult {
  supabase: SupabaseClient
  user: { id: string; email?: string }
  employee: { role: string; department_id: string }
}

/**
 * Shared role assertion helper for department server actions.
 *
 * Verifies the caller is authenticated AND has one of the allowed roles.
 * Throws typed AppError subclasses (AuthError, ForbiddenError) so callers
 * can rely on catch blocks rather than checking return types.
 *
 * Usage:
 *   const { supabase, employee } = await assertDeptRole(['admin', 'safety', 'supervisor'], 'safety')
 */
export async function assertDeptRole(
  allowedRoles: string[],
  resource: string
): Promise<RoleAuthResult> {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Unauthorized')

  const { data: employee } = await supabase
    .from('employees')
    .select('role, department_id')
    .eq('auth_id', user.id)
    .single()

  if (!employee || !allowedRoles.includes(employee.role)) {
    throw new ForbiddenError(`Forbidden: ${allowedRoles.join(' or ')} role required`, {
      resource,
      action: 'assert_role',
    })
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    employee: { role: employee.role, department_id: employee.department_id ?? '' },
  }
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
