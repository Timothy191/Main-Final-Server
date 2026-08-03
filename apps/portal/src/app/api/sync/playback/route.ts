/**
 * @swagger
 * /api/sync/playback:
 *   post:
 *     summary: Queue sync playback event
 *     description: Queue a sync playback event via Inngest for offline-first data synchronization. Uses idempotency keys to prevent duplicate processing.
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idempotencyKey
 *               - actionType
 *               - payload
 *               - departmentId
 *             properties:
 *               idempotencyKey:
 *                 type: string
 *                 description: Unique key to prevent duplicate processing
 *               actionType:
 *                 type: string
 *                 description: Type of sync action (create, update, delete)
 *               payload:
 *                 type: object
 *                 description: Action payload data
 *               departmentId:
 *                 type: string
 *                 description: Department ID for the sync event
 *     responses:
 *       200:
 *         description: Event queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queued:
 *                   type: boolean
 *       400:
 *         description: Invalid request body or missing required fields
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { inngest, syncPlaybackEvent } from '@repo/utils/inngest'
import { logError } from '@/lib/errors/error-logger'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'
import { validateBody } from '@/lib/api/response'
import { applyCors } from '@/lib/api/cors'
import { withBodyLimit } from '@/lib/api/body-limit'
import { syncPlaybackSchema } from '@repo/contract'

async function handlePlaybackRequest(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const reqClone = req.clone()
    const body = await reqClone.json().catch(() => ({}))
    const { idempotencyKey, actionType, payload, departmentId } = body
    if (!idempotencyKey || !actionType || !payload || !departmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const parsed = await validateBody(req, syncPlaybackSchema)
    if (parsed instanceof NextResponse) return parsed

    await inngest.send({
      name: syncPlaybackEvent,
      data: {
        idempotencyKey: parsed.data.idempotencyKey,
        actionType: parsed.data.actionType,
        payload: parsed.data.payload,
        departmentId: parsed.data.departmentId,
      },
    })

    return NextResponse.json({ success: true, queued: true })
  } catch (err: unknown) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'sync_playback',
    })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return withBodyLimit(
    req,
    async () => {
      return applyCors(req, await withRateLimit(req, () => handlePlaybackRequest(req)))
    },
    { maxSize: 1048576 }
  )
}
