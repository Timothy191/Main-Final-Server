/**
 * @swagger
 * /api/webhooks/{id}:
 *   put:
 *     summary: Update webhook endpoint
 *     description: Update an existing webhook endpoint. All fields are optional - only provided fields will be updated. Non-admins can only update webhooks for their department.
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: New webhook URL
 *               description:
 *                 type: string
 *                 description: New webhook description
 *               event_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [daily_log.created, daily_log.updated, breakdown.created, breakdown.updated, breakdown.completed, safety_incident.created, safety_incident.updated, safety_incident.resolved, production_log.created, production_log.updated, operational_delay.created, operational_delay.updated]
 *                 description: Event types to subscribe to
 *               active:
 *                 type: boolean
 *                 description: Whether the webhook is active
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhook:
 *                   type: object
 *                   description: Updated webhook endpoint
 *       400:
 *         description: Invalid request body
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
 *   delete:
 *     summary: Delete webhook endpoint
 *     description: Soft delete a webhook endpoint (sets deleted_at timestamp). Non-admins can only delete webhooks for their department.
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
 *         description: Webhook deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
import { revalidatePath } from 'next/cache'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'
import { validateBody } from '@/lib/api/response'
import { applyCors } from '@/lib/api/cors'
import { updateWebhookSchema } from '@repo/contract'
import { validateWebhookUrl } from '@/lib/api/ssrf-guard'

async function handlePutWebhook(
  request: NextRequest,
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

  const parsed = await validateBody(request, updateWebhookSchema)
  if (parsed instanceof NextResponse) return parsed
  const { url, description, event_types, active } = parsed.data

  // SSRF protection: validate webhook URL if being updated
  if (url !== undefined) {
    try {
      validateWebhookUrl(url)
    } catch (ssrfError) {
      return NextResponse.json(
        { error: ssrfError instanceof Error ? ssrfError.message : 'Invalid webhook URL' },
        { status: 400 }
      )
    }
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

  // Check if user has permission to update this webhook
  if (employee.role !== 'admin') {
    if (
      existingWebhook.department_id !== employee.department_id &&
      !employee.accessible_departments?.includes(existingWebhook.department_id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data: webhook, error } = await supabase
    .from('webhook_endpoints')
    .update({
      ...(url !== undefined && { url }),
      ...(description !== undefined && { description }),
      ...(event_types !== undefined && { event_types }),
      ...(active !== undefined && { active }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }

  revalidatePath('/admin/tools')
  revalidatePath('/(departments)/[department]/tools')

  return NextResponse.json({ webhook })
}

// PUT /api/webhooks/[id] - Update a webhook endpoint
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const response = await withRateLimit(request, () => handlePutWebhook(request, { params }))
  return applyCors(request, response)
}

async function handleDeleteWebhook(
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

  // Check if user has permission to delete this webhook
  if (employee.role !== 'admin') {
    if (
      existingWebhook.department_id !== employee.department_id &&
      !employee.accessible_departments?.includes(existingWebhook.department_id)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Soft delete
  const { error } = await supabase
    .from('webhook_endpoints')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }

  revalidatePath('/admin/tools')
  revalidatePath('/(departments)/[department]/tools')

  return NextResponse.json({ success: true })
}

// DELETE /api/webhooks/[id] - Delete a webhook endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = await withRateLimit(request, () => handleDeleteWebhook(request, { params }))
  return applyCors(request, response)
}
