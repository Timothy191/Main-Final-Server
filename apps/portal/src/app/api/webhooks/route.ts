/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: List webhook endpoints
 *     description: Retrieve all webhook endpoints. Admins can see all webhooks, supervisors only see webhooks for their department.
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of webhook endpoints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Webhook endpoint ID
 *                       url:
 *                         type: string
 *                         description: Webhook URL
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         description: Webhook description
 *                       event_types:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [daily_log.created, daily_log.updated, breakdown.created, breakdown.updated, breakdown.completed, safety_incident.created, safety_incident.updated, safety_incident.resolved, production_log.created, production_log.updated, operational_delay.created, operational_delay.updated]
 *                       department_id:
 *                         type: string
 *                         nullable: true
 *                       active:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       429:
 *         description: Rate limit exceeded
 *   post:
 *     summary: Create webhook endpoint
 *     description: Create a new webhook endpoint for receiving event notifications. Non-admins can only create webhooks for their department.
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - event_types
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Webhook endpoint URL
 *               description:
 *                 type: string
 *                 description: Webhook description
 *               event_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [daily_log.created, daily_log.updated, breakdown.created, breakdown.updated, breakdown.completed, safety_incident.created, safety_incident.updated, safety_incident.resolved, production_log.created, production_log.updated, operational_delay.created, operational_delay.updated]
 *                 description: Event types to subscribe to
 *               department_id:
 *                 type: string
 *                 description: Department ID (defaults to user's department if not provided)
 *     responses:
 *       201:
 *         description: Webhook created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhook:
 *                   type: object
 *                   description: Created webhook endpoint
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
import { withBodyLimit } from '@/lib/api/body-limit'
import { createWebhookSchema } from '@repo/contract'
import { validateWebhookUrl } from '@/lib/api/ssrf-guard'

type WebhookEventType =
  | 'daily_log.created'
  | 'daily_log.updated'
  | 'breakdown.created'
  | 'breakdown.updated'
  | 'breakdown.completed'
  | 'safety_incident.created'
  | 'safety_incident.updated'
  | 'safety_incident.resolved'
  | 'production_log.created'
  | 'production_log.updated'
  | 'operational_delay.created'
  | 'operational_delay.updated'

interface _WebhookEndpoint {
  id: string
  url: string
  description: string | null
  event_types: WebhookEventType[]
  department_id: string | null
  active: boolean
  secret: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string | null
}

async function handleGetWebhooks(_request: NextRequest): Promise<NextResponse> {
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

  // Admins can see all webhooks, supervisors only their department's
  let query = supabase.from('webhook_endpoints').select('*').is('deleted_at', null)

  if (employee.role !== 'admin') {
    query = query.or(
      `department_id.eq.${employee.department_id},department_id.in.(${(employee.accessible_departments || []).join(',')})`
    )
  }

  const { data: webhooks, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  return NextResponse.json({ webhooks })
}

// GET /api/webhooks - List all webhook endpoints
export async function GET(request: NextRequest) {
  const response = await withRateLimit(request, () => handleGetWebhooks(request))
  return applyCors(request, response)
}

async function handleCreateWebhook(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await validateBody(request, createWebhookSchema)
  if (parsed instanceof NextResponse) return parsed
  const { url, description, event_types, department_id } = parsed.data

  // SSRF protection: validate webhook URL against private IP ranges
  try {
    validateWebhookUrl(url)
  } catch (ssrfError) {
    return NextResponse.json(
      { error: ssrfError instanceof Error ? ssrfError.message : 'Invalid webhook URL' },
      { status: 400 }
    )
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

  // Non-admins can only create webhooks for their department
  if (employee.role !== 'admin') {
    const targetDept = department_id || employee.department_id
    if (
      targetDept !== employee.department_id &&
      !employee.accessible_departments?.includes(targetDept)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data: webhook, error } = await supabase
    .from('webhook_endpoints')
    .insert({
      url,
      description,
      event_types,
      department_id: department_id || employee.department_id,
      active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }

  revalidatePath('/admin/tools')
  revalidatePath('/(departments)/[department]/tools')

  return NextResponse.json({ webhook }, { status: 201 })
}

// POST /api/webhooks - Create a new webhook endpoint
export async function POST(request: NextRequest) {
  const response = await withRateLimit(request, () =>
    withBodyLimit(request, () => handleCreateWebhook(request), {
      maxSize: 524288,
    })
  )
  return applyCors(request, response)
}
