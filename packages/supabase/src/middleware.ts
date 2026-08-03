/**
 * @repo/supabase/middleware
 * Edge/proxy-compatible Supabase client for Next.js middleware / proxy.ts.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

function getEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    throw new Error(
      `[supabase/middleware] Missing environment variable: ${key}. ` +
        'Check your apps/portal/.env.local file.'
    )
  }
  return val
}

/** Result of creating a middleware client — the Supabase instance and a mutable response carrying refreshed cookies. */
export interface MiddlewareClientResult {
  supabase: ReturnType<typeof createServerClient>
  response: NextResponse
}

/**
 * Create a Supabase client bound to the incoming request cookies and a
 * mutable NextResponse that carries refreshed auth cookies.
 */
export async function createMiddlewareClient(
  request: NextRequest
): Promise<MiddlewareClientResult> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )

  return { supabase, response }
}
