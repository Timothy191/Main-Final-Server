/**
 * @repo/supabase/service-role
 * Service-role Supabase client — full bypass of RLS. Use with care.
 */
import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    throw new Error(
      `[supabase/service-role] Missing environment variable: ${key}. ` +
        'Check your apps/portal/.env.local file.'
    )
  }
  return val
}

export function createServiceRoleClient() {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
