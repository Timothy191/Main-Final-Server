/**
 * Shared department route / role-gate constants and auth helpers.
 *
 * AGENT-TRACE: The ACL data (department slugs, restricted route→role map) and
 * the pure predicates now live in `@repo/acl`, so this node-runtime file and
 * the edge-runtime `proxy.ts` share a single source of truth and can no longer
 * drift (the former inline copies had diverged — proxy carried a `tools` key
 * this file lacked). This module re-exports them for existing importers
 * (`assertDeptRole`, `isDeptAllowedForRole`, `filterDepartmentsByRole`, the
 * slug/role constants) and keeps `assertDeptRole` local because it needs a
 * server Supabase client, which cannot live in the edge-safe `@repo/acl`.
 *
 * Used by hub UI filters, server actions, and kept in sync with
 * apps/portal/proxy.ts via @repo/acl (no manual sync needed anymore).
 */

// Canonical ACL — re-exported so existing `from '@/lib/dept-access'` importers
// keep resolving. Source of truth is packages/acl/src/index.ts.
export {
  DEPARTMENT_ROUTE_SLUGS,
  RESTRICTED_DEPT_ROLES,
  type DepartmentRouteSlug,
  type Role,
  isDeptAllowedForRole,
  filterDepartmentsByRole,
  normalizeRole,
} from '@repo/acl'

import { AuthError, ForbiddenError } from '@/lib/errors/error-classes'
import type { SupabaseClient } from '@supabase/supabase-js'

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
