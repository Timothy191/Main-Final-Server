import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { getShiftCompleteness } from '@/lib/shift-completeness'

/**
 * @swagger
 * /api/control-room/shift-completeness:
 *   get:
 *     summary: Get shift completeness metrics
 *     description: Returns completeness metrics for a specific department, date, and shift. Requires authentication.
 *     tags:
 *       - Control Room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: deptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department UUID
 *       - in: query
 *         name: deptSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Department slug
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Shift date (YYYY-MM-DD)
 *       - in: query
 *         name: shift
 *         required: true
 *         schema:
 *           type: string
 *           enum: [day, night]
 *         description: Shift type
 *     responses:
 *       200:
 *         description: Shift completeness data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const deptId = searchParams.get('deptId')
  const deptSlug = searchParams.get('deptSlug')
  const date = searchParams.get('date')
  const shift = searchParams.get('shift') as 'day' | 'night' | null

  if (!deptId || !deptSlug || !date || !shift) {
    return NextResponse.json(
      { error: 'Missing required params: deptId, deptSlug, date, shift' },
      { status: 400 }
    )
  }

  const completeness = await getShiftCompleteness(supabase, deptId, deptSlug, date, shift)

  return NextResponse.json(completeness)
}
