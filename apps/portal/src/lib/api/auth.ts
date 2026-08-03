import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'

/**
 * Require an authenticated admin user. Returns the supabase client and user,
 * or a NextResponse error that should be returned immediately.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    } as const
  }

  return { supabase, user } as const
}
