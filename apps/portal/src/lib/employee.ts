import { headers } from 'next/headers'
import type { SupabaseClient } from '@repo/supabase'

/** Resolve employees.id from Supabase Auth user id (auth.users).
 *  Checks middleware header first to avoid redundant DB query.
 *  Falls back to DB query when headers() is unavailable (e.g. tests). */
export async function getEmployeeIdForAuthUser(
  supabase: SupabaseClient,
  authUserId: string
): Promise<string | null> {
  try {
    const headerEmployeeId = (await headers()).get('x-auth-employee-id')
    if (headerEmployeeId) return headerEmployeeId
  } catch {
    // Called outside request scope (e.g. tests); fall through to DB query.
  }

  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_id', authUserId)
    .maybeSingle()

  return data?.id ?? null
}
