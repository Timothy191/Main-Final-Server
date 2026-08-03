/**
 * @repo/supabase/server
 * Server-only Supabase clients (cookie session + service-role admin).
 * Never import this in Client Components.
 */
import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    throw new Error(
      `[supabase/server] Missing environment variable: ${key}. ` +
        'Check your apps/portal/.env.local file.'
    )
  }
  return val
}

/**
 * Fetch wrapper that records PostgREST timing when `__recordDbQuery` is set
 * (portal observability / tests).
 */
export async function instrumentedFetch(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): Promise<Response> {
  const started = performance.now()
  const method = (init?.method ?? 'GET').toUpperCase()
  let table = 'unknown'
  let success = false

  try {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const path = new URL(href).pathname
    const restIdx = path.indexOf('/rest/v1/')
    if (restIdx >= 0) {
      const after = path.slice(restIdx + '/rest/v1/'.length)
      table = after.split('/')[0]?.split('?')[0] || 'unknown'
    }
  } catch {
    table = 'unknown'
  }

  try {
    const response = await fetch(input, init)
    success = response.ok
    return response
  } catch (err) {
    success = false
    throw err
  } finally {
    const record = (globalThis as { __recordDbQuery?: Function }).__recordDbQuery
    if (typeof record === 'function') {
      record(table, method, performance.now() - started, success)
    }
  }
}

/** Service-role admin client — full bypass of RLS. Use with care. */
export function createAdminClient() {
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

/**
 * Cookie-backed server client for RSC / Route Handlers / Server Actions.
 * Sessions from signInWithPassword persist via Set-Cookie on the response.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component — proxy/middleware refreshes sessions.
          }
        },
      },
    }
  )
}

/** Get current user safely, returns null if not authenticated. */
export async function getUserSafely(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}
