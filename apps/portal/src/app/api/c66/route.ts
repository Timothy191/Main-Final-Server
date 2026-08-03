import { createServiceRoleClient } from '@repo/supabase/service-role'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/errors/error-logger'
import { validateBody } from '@/lib/api/response'
import { applyCors } from '@/lib/api/cors'
import { withBodyLimit } from '@/lib/api/body-limit'
import { scannerBadgeSchema } from '@repo/contract'

/**
 * @swagger
 * /api/c66:
 *   post:
 *     summary: Badge scanner validation endpoint
 *     description: Validates badge QR codes from C66 hardware scanners. Checks badge status, personnel/visitor authorization, and logs access events. Requires scanner API token authentication.
 *     tags:
 *       - Access Control
 *     security:
 *       - bearerAuth: []
 *     headers:
 *       - name: x-scanner-token
 *         required: true
 *         description: Scanner API token for authentication
 *         schema:
 *           type: string
 *       - name: x-scanner-source
 *         required: true
 *         description: Scanner source identifier
 *         schema:
 *           type: string
 *           enum: [C66-HARDWARE, C66-SCANNER, GATE-TERMINAL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Badge QR code
 *               barcode:
 *                 type: string
 *                 description: Barcode data (alternative to code)
 *               barcodeData:
 *                 type: string
 *                 description: Barcode data field (alternative to code)
 *               data:
 *                 type: string
 *                 description: Raw data field (alternative to code)
 *               qr_code:
 *                 type: string
 *                 description: QR code field (alternative to code)
 *     responses:
 *       200:
 *         description: Badge validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 name:
 *                   type: string
 *                   description: Personnel or visitor name
 *                 message:
 *                   type: string
 *                   description: Access result message
 *       400:
 *         description: Bad request - empty code payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized - invalid scanner token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - unauthorized scanner source or revoked badge
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       404:
 *         description: Badge not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 name:
 *                   type: string
 *                   example: Unrecognized Badge
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */

const ALLOWED_SCANNER_SOURCES = process.env.ALLOWED_SCANNER_SOURCES?.split(',').map((s) =>
  s.trim()
) || ['C66-HARDWARE', 'C66-SCANNER', 'GATE-TERMINAL']

export async function POST(request: Request) {
  return withBodyLimit(
    request,
    async () => {
      const response = await handlePost(request)
      return applyCors(request, response)
    },
    { maxSize: 65536 }
  )
}

async function handlePost(request: Request) {
  try {
    const source = request.headers.get('x-scanner-source') || 'unknown'
    const token = request.headers.get('x-scanner-token')
    const expectedToken = process.env.SCANNER_API_KEY

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized scanner token' },
        { status: 401 }
      )
    }

    if (!ALLOWED_SCANNER_SOURCES.includes(source)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized scanner source' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    const parsed = await validateBody(request, scannerBadgeSchema)
    if (parsed instanceof NextResponse) return parsed

    const code = (
      parsed.data.code ||
      parsed.data.barcode ||
      parsed.data.barcodeData ||
      parsed.data.data ||
      parsed.data.qr_code ||
      ''
    ).trim()
    if (!code) {
      return NextResponse.json({ success: false, error: 'Empty code payload' }, { status: 400 })
    }

    // 1. Find the Badge and check if it's active
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id, is_active, entity_type, personnel_id, visitor_id')
      .eq('qr_code', code)
      .single()

    if (badgeError || !badge) {
      // Badge not found in database at all
      await logAccess(supabase, null, 'UNKNOWN', 'DENIED - Unrecognized Badge', source)
      return NextResponse.json({ success: false, name: 'Unrecognized Badge' }, { status: 404 })
    }

    if (!badge.is_active) {
      // Badge revoked
      await logAccess(supabase, badge.id, badge.entity_type, 'DENIED - Badge Revoked', source)
      return NextResponse.json({ success: false, name: 'Revoked Badge' }, { status: 403 })
    }

    // 2. Resolve the Identity
    let entityName = 'Unknown Entity'
    let isAuthorized = true
    let denialReason = null

    if (badge.entity_type === 'personnel' && badge.personnel_id) {
      const { data: person } = await supabase
        .from('personnel')
        .select('first_name, surname, status')
        .eq('id', badge.personnel_id)
        .single()
      if (person) {
        entityName = `${person.first_name} ${person.surname}`
        if (person.status !== 'Active') {
          isAuthorized = false
          denialReason = `DENIED - Personnel Status: ${person.status}`
        }
      }
    } else if (badge.entity_type === 'visitor' && badge.visitor_id) {
      const { data: visitor } = await supabase
        .from('visitors')
        .select('name, status')
        .eq('id', badge.visitor_id)
        .single()
      if (visitor) {
        entityName = visitor.name
        if (visitor.status !== 'Checked In') {
          isAuthorized = false
          denialReason = `DENIED - Visitor Status: ${visitor.status}`
        }
      }
    }

    // 3. Log the Access Event
    await logAccess(
      supabase,
      badge.id,
      badge.entity_type,
      isAuthorized ? null : denialReason,
      source,
      isAuthorized
    )

    return NextResponse.json({
      success: isAuthorized,
      name: entityName,
      message: isAuthorized ? 'Access Granted' : denialReason,
    })
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      url: '/api/c66',
      method: 'POST',
    })
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

async function logAccess(
  supabase: ReturnType<typeof createServiceRoleClient>,
  badgeId: string | null,
  entityType: string,
  denialReason: string | null,
  gateLocation: string,
  accessGranted: boolean = false
) {
  const { error } = await supabase.from('access_logs').insert([
    {
      badge_id: badgeId,
      access_type: entityType,
      direction: 'IN', // Simplified for now, could be toggled based on previous state
      gate_location: gateLocation,
      access_granted: accessGranted,
      denial_reason: denialReason,
    },
  ])

  if (error) {
    logError(new Error(error.message), {
      url: '/api/c66',
      context: 'access_log_write_failed',
    })
  }
}
