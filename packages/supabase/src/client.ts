/**
 * @repo/supabase/client
 * Browser-safe Supabase client.
 * Import in Client Components only.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const val = typeof process !== 'undefined' ? process.env[key] : undefined
  if (!val) {
    throw new Error(
      `[supabase] Missing environment variable: ${key}. ` +
        'Check your apps/portal/.env.local file.'
    )
  }
  return val
}

export function createClient() {
  return createSupabaseClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}

// Legacy export for compatibility
export function createBrowserSupabaseClient() {
  return createClient()
}
