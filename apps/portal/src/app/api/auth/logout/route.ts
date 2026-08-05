import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    const redirectUrl = new URL('/login', request.url)
    if (redirectUrl.origin !== request.nextUrl.origin) {
      return new Response('Invalid redirect', { status: 400 })
    }
    return NextResponse.redirect(redirectUrl, 303)
  } catch (error) {
    console.error('Logout error:', error)
    // Even on error, it's safer to redirect to login when using form posts
    const redirectUrl = new URL('/login', request.url)
    if (redirectUrl.origin !== request.nextUrl.origin) {
      return new Response('Invalid redirect', { status: 400 })
    }
    return NextResponse.redirect(redirectUrl, 303)
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    const redirectUrl = new URL('/login', request.url)
    if (redirectUrl.origin !== request.nextUrl.origin) {
      return new Response('Invalid redirect', { status: 400 })
    }
    return NextResponse.redirect(redirectUrl, 303)
  } catch (error) {
    console.error('Logout error:', error)
    const redirectUrl = new URL('/login', request.url)
    if (redirectUrl.origin !== request.nextUrl.origin) {
      return new Response('Invalid redirect', { status: 400 })
    }
    return NextResponse.redirect(redirectUrl, 303)
  }
}
