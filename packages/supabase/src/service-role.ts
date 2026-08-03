/**
 * @repo/supabase/service-role
 * Service-role Supabase client — bypasses RLS entirely.
 * Must never be used in Client Components or exposed to the browser.
 * Only for admin-only API routes and background jobs.
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

/**
 * Create a Supabase admin client using the service role key.
 * Full bypass of RLS — use only in trusted server contexts.
 */
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
