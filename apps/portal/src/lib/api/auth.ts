import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  user: { id: string }
}

export interface RoleAuthContext extends AuthContext {
  employee: { role: string; department_id: string; accessible_departments: string[] | null }
}

/**
 * Require an authenticated user. Returns the supabase client and user,
 * or a NextResponse 401 error that should be returned immediately.
 */
export async function requireAuth(): Promise<AuthContext | { error: NextResponse }> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { supabase, user }
}

/**
 * Require an authenticated user whose role is in the allowed list.
 * Returns the supabase client, user, and employee row,
 * or a NextResponse 401/403 error that should be returned immediately.
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<RoleAuthContext | { error: NextResponse }> {
  const auth = await requireAuth()
  if ('error' in auth) return auth

  const { supabase, user } = auth
  const { data: employee } = await supabase
    .from('employees')
    .select('role, department_id, accessible_departments')
    .eq('auth_id', user.id)
    .single()

  if (!employee || !allowedRoles.includes(employee.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    supabase,
    user,
    employee: {
      role: employee.role,
      department_id: employee.department_id ?? '',
      accessible_departments: employee.accessible_departments ?? [],
    },
  }
}

/**
 * Require an authenticated admin user. Returns the supabase client and user,
 * or a NextResponse error that should be returned immediately.
 */
export async function requireAdmin() {
  const result = await requireRole(['admin'])
  if ('error' in result) return result

  const { supabase, user } = result
  return { supabase, user } as const
}
