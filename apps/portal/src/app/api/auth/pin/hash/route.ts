import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { randomBytes, pbkdf2Sync } from 'node:crypto'

/**
 * @swagger
 * /api/auth/pin/hash:
 *   post:
 *     summary: Hash a shift closeout PIN
 *     description: Hashes a PIN using bcrypt for shift closeout verification. Requires authentication.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 minLength: 4
 *                 description: PIN to hash (minimum 4 characters)
 *     responses:
 *       200:
 *         description: PIN hash
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *       400:
 *         description: Invalid PIN (too short)
 *       401:
 *         description: Unauthorized
 */

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pin } = body

    if (!pin || pin.length < 4) {
      return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 })
    }

    // PBKDF2 with random salt — no external deps needed
    const salt = randomBytes(16).toString('hex')
    const derived = pbkdf2Sync(pin, salt, 100_000, 64, 'sha512')
    const hash = `pbkdf2:sha512:${salt}:${derived.toString('hex')}`

    return NextResponse.json({ hash })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to hash PIN' }, { status: 500 })
  }
}
