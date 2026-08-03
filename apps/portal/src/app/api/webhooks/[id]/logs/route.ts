/**
 * @swagger
 * /api/webhooks/{id}/logs:
 *   get:
 *     summary: Get webhook delivery logs
 *     description: Retrieve delivery logs for a specific webhook endpoint. Returns the last 50 log entries in reverse chronological order. Non-admins can only view logs for webhooks in their department.
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook endpoint ID
 *     responses:
 *       200:
 *         description: List of delivery logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       webhook_endpoint_id:
 *                         type: string
 *                       event_type:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [success, failed, retrying]
 *                       response_status:
 *                         type: number
 *                         nullable: true
 *                       error_message:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Webhook not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'

async function handleGetLogs(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's department and role
  const { data: employee } = await supabase
    .from('employees')
    .select('department_id, role, accessible_departments')
    .eq('auth_id', user.id)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  // Get the webhook to check ownership
  const { data: existingWebhook } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('id', id)
    .single()

  if (!existingWebhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // Check if user has permission to view logs for this webhook
  if (employee.role !== 'admin') {
    if (
      existingWebhook.department_id !== employee.department_id &&
      !employee.accessible_departments?.includes(existingWebhook.department_id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Get delivery logs
  const { data: logs, error } = await supabase
    .from('webhook_delivery_logs')
    .select('*')
    .eq('webhook_endpoint_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  return NextResponse.json({ logs })
}

// GET /api/webhooks/[id]/logs - Get delivery logs for a webhook
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRateLimit(request, () => handleGetLogs(request, { params }))
}
