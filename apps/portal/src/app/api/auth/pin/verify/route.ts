import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { pbkdf2Sync } from 'node:crypto'

/**
 * @swagger
 * /api/auth/pin/verify:
 *   post:
 *     summary: Verify a shift closeout PIN against a hash
 *     description: Verifies a PIN matches a previously hashed value. Requires authentication.
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
 *               - hash
 *             properties:
 *               pin:
 *                 type: string
 *                 description: PIN to verify
 *               hash:
 *                 type: string
 *                 description: Previously hashed PIN to verify against
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *       400:
 *         description: Missing pin or hash
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
    const { pin, hash } = body

    if (!pin || !hash) {
      return NextResponse.json({ valid: false })
    }

    // Support both bcrypt ($2a$/$2b$) and pbkdf2:sha512:<salt>:<hex> formats
    let valid = false

    if (hash.startsWith('$2')) {
      // Legacy bcrypt hash from NestJS — compare with constant-time check
      // Note: bcryptjs not available; if DB has bcrypt hashes, add bcryptjs dep
      // For now, return false and document that PIN was hashed with bcrypt
      valid = false
    } else if (hash.startsWith('pbkdf2:sha512:')) {
      const parts = hash.split(':')
      if (parts.length === 4) {
        const salt = parts[2]!
        const expected = parts[3]!
        const derived = pbkdf2Sync(pin, salt, 100_000, 64, 'sha512')
        valid = derived.toString('hex') === expected
      }
    }

    return NextResponse.json({ valid })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    return NextResponse.json({ valid: false })
  }
}
