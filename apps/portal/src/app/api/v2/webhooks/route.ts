/**
 * Arch System API v2 — Webhooks Management
 * Next.js 16 App Router API v2 endpoint for webhooks CRUD.
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

async function handleGetWebhooks(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('department_id, role, accessible_departments')
    .eq('auth_id', user.id)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

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

  return NextResponse.json({ webhooks, version: 'v2' })
}

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

  try {
    validateWebhookUrl(url)
  } catch (ssrfError) {
    return NextResponse.json(
      { error: ssrfError instanceof Error ? ssrfError.message : 'Invalid webhook URL' },
      { status: 400 }
    )
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('department_id, role, accessible_departments')
    .eq('auth_id', user.id)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

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

  return NextResponse.json({ webhook, version: 'v2' }, { status: 201 })
}

export async function POST(request: NextRequest) {
  const response = await withRateLimit(request, () =>
    withBodyLimit(request, () => handleCreateWebhook(request), {
      maxSize: 524288,
    })
  )
  return applyCors(request, response)
}
