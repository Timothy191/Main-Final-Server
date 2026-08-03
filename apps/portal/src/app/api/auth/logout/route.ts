import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { InternalError } from '@repo/errors'

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Sign out current user
 *     description: Terminates the Supabase user session and clears authentication cookies
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 redirectUrl:
 *                   type: string
 *                   example: "/login"
 *       500:
 *         description: Internal server error during logout
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true, redirectUrl: '/login' }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    const err = new InternalError('An error occurred during logout')
    return NextResponse.json(err.toJSON(), { status: err.status })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    return NextResponse.redirect(new URL('/login', request.url))
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
