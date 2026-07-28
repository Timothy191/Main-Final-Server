import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { InternalError } from '@repo/errors'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    // Redirect to login page instead of returning JSON
    return NextResponse.redirect(new URL('/login', request.url), 303)
  } catch (error) {
    console.error('Logout error:', error)
    // Even on error, it's safer to redirect to login when using form posts
    return NextResponse.redirect(new URL('/login', request.url), 303)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    return NextResponse.redirect(new URL('/login', request.url), 303)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.redirect(new URL('/login', request.url), 303)
  }
}
