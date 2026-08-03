/**
 * @swagger
 * /api/admin/data/{table}:
 *   get:
 *     summary: Query admin data tables
 *     description: Query operational tables (machines, daily_logs, breakdowns, safety_incidents, etc.) with pagination. Admin-only access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Table name (must be in OPERATIONAL_TABLES whitelist)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Pagination offset
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *         description: Sort column
 *       - in: query
 *         name: eq
 *         schema:
 *           type: string
 *         description: Equality filter (column=value)
 *     responses:
 *       200:
 *         description: Query results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin-only)
 *       404:
 *         description: Table not found or not allowed
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Insert into admin data tables
 *     description: Insert records into operational tables. Admin-only access with rate limiting for machine status updates.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Table name (must be in OPERATIONAL_TABLES whitelist)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Record to insert (schema depends on table)
 *     responses:
 *       200:
 *         description: Insert successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin-only)
 *       404:
 *         description: Table not found or not allowed
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update admin data tables
 *     description: Update records in operational tables. Admin-only access with rate limiting for machine status updates.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Table name (must be in OPERATIONAL_TABLES whitelist)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Record updates (schema depends on table)
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin-only)
 *       404:
 *         description: Table not found or not allowed
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete from admin data tables
 *     description: Delete records from operational tables. Admin-only access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Table name (must be in OPERATIONAL_TABLES whitelist)
 *       - in: query
 *         name: eq
 *         required: true
 *         schema:
 *           type: string
 *         description: Equality filter for delete (column=value)
 *     responses:
 *       200:
 *         description: Delete successful
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
 *         description: Forbidden (admin-only)
 *       404:
 *         description: Table not found or not allowed
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'
import { RateLimiter, RedisStore, FixedWindowStrategy } from '@repo/rate-limiter'
import { getRedisClient } from '@repo/redis'
import { serverLogger } from '@repo/logger'

const OPERATIONAL_TABLES = new Set([
  'machines',
  'daily_logs',
  'machine_hours',
  'fuel_logs',
  'production_logs',
  'machine_operations',
  'hourly_loads',
  'delay_entries', // AGENT-TRACE: New delay tracking system (replaces operational_delays)
  'delay_categories', // AGENT-TRACE: New delay categories
  // "operational_delays", // DEPRECATED 2025-01-15 - Replaced by delay_entries system
  'engineering_notes',
  'shift_status',
  'excavator_activity',
  'excavator_dumper_assignments',
  'dozer_rolls',
  'breakdowns',
  'safety_incidents',
  'drill_operations',
  'documents',
  'document_versions',
  'machine_configurations',
  'operators',
  'sites',
  'mine_blocks',
  'report_templates',
  'safety_severities',
  'safety_incident_categories',
  'generated_reports',
  'personnel',
  'visitors',
  'badges',
  'fleet',
  'equipment',
  'access_logs',
])

// AGENT-TRACE: Per-machine rate limiter to prevent rapid status toggling
async function getMachineStatusRateLimiter(): Promise<RateLimiter | null> {
  try {
    const redis = getRedisClient()
    if (redis.status === 'ready') {
      const store = new RedisStore(
        redis as unknown as import('@repo/rate-limiter').SimpleRedisClient
      )
      const strategy = new FixedWindowStrategy()
      return new RateLimiter({
        store,
        strategy,
        limit: 10, // 10 updates per minute per machine
        windowMs: 60 * 1000, // 1 minute
        keyPrefix: 'machine_status_update:',
      })
    }
  } catch (error) {
    serverLogger().warn('Redis not available for machine rate limiting:', error)
  }
  return null
}

async function assertAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized', status: 401 } as const
  }
  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()
  if (!employee || employee.role !== 'admin') {
    return { error: 'Forbidden', status: 403 } as const
  }
  return { employee, user }
}

async function handleGetRequest(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await assertAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { table: rawTable } = await params
  const table = rawTable.toLowerCase()
  if (!OPERATIONAL_TABLES.has(table)) {
    return NextResponse.json({ error: 'Unknown table' }, { status: 404 })
  }

  const { searchParams } = _request.nextUrl
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const orderBy = searchParams.get('order_by') ?? 'created_at'
  const orderDir = searchParams.get('order_dir') === 'asc' ? 'asc' : 'desc'

  const serviceRole = createServiceRoleClient()
  const query = serviceRole
    .from(table)
    .select('*', { count: 'exact' })
    .order(orderBy, { ascending: orderDir === 'asc' })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  return NextResponse.json({ data, count, limit, offset })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  return withRateLimit(request, () => handleGetRequest(request, { params }))
}

async function handlePutRequest(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await assertAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { table: rawTable } = await params
  const table = rawTable.toLowerCase()
  if (!OPERATIONAL_TABLES.has(table)) {
    return NextResponse.json({ error: 'Unknown table' }, { status: 404 })
  }

  const body = await request.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing record id' }, { status: 400 })
  }

  // AGENT-TRACE: Per-machine rate limiting for status updates
  if (table === 'machines' && 'active' in data) {
    const rateLimiter = await getMachineStatusRateLimiter()
    if (rateLimiter) {
      const rateLimitResult = await rateLimiter.check(id)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Too many status updates for this machine. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
          },
          { status: 429 }
        )
      }
    }
  }

  const serviceRole = createServiceRoleClient()

  const { data: before } = await serviceRole.from(table).select('*').eq('id', id).single()

  const { error } = await serviceRole.from(table).update(data).eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  await serviceRole.from('audit_logs').insert({
    action: 'update',
    table_name: table,
    record_id: id,
    old_data: before ?? null,
    new_data: data,
    performed_by: auth.employee.id,
  })

  return NextResponse.json({ success: true })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  return withRateLimit(request, () => handlePutRequest(request, { params }))
}

async function handleDeleteRequest(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const auth = await assertAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { table: rawTable } = await params
  const table = rawTable.toLowerCase()
  if (!OPERATIONAL_TABLES.has(table)) {
    return NextResponse.json({ error: 'Unknown table' }, { status: 404 })
  }

  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400 })
  }

  const serviceRole = createServiceRoleClient()

  const { data: before } = await serviceRole.from(table).select('*').eq('id', id).single()

  const { error } = await serviceRole.from(table).delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  await serviceRole.from('audit_logs').insert({
    action: 'delete',
    table_name: table,
    record_id: id,
    old_data: before ?? null,
    performed_by: auth.employee.id,
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  return withRateLimit(request, () => handleDeleteRequest(request, { params }))
}
