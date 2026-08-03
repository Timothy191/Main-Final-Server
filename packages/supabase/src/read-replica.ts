/**
 * @repo/supabase/read-replica
 * Read-replica Supabase client for analytics and reporting queries.
 * Uses the read-replica URL to offload read traffic from the primary DB.
 * Falls back to anon key if READ_REPLICA_URL is not configured.
 */
import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback
  if (!val) {
    throw new Error(
      `[supabase/read-replica] Missing environment variable: ${key}. ` +
        'Check your apps/portal/.env.local file.'
    )
  }
  return val
}

/**
 * Create a read-replica Supabase client.
 * Uses NEXT_PUBLIC_SUPABASE_READ_REPLICA_URL if available,
 * otherwise falls back to the main Supabase URL (read-only anon key).
 *
 * Cookie list is optional — pass cookies from the request for RLS context.
 */
export async function createReadReplicaClient(cookieList?: Array<{ name: string; value: string }>) {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_READ_REPLICA_URL', getEnv('NEXT_PUBLIC_SUPABASE_URL'))
  const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const client = createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // If cookies are provided, set the auth session for RLS
  if (cookieList && cookieList.length > 0) {
    const authCookie = cookieList.find((c) => c.name.startsWith('sb-'))
    if (authCookie) {
      try {
        await client.auth.setSession({
          access_token: authCookie.value,
          refresh_token: '',
        })
      } catch {
        // Session may be invalid — proceed without RLS context
      }
    }
  }

  return client
}
