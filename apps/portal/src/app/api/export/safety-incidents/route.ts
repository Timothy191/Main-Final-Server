/**
 * @swagger
 * /api/export/safety-incidents:
 *   get:
 *     summary: Export safety incidents
 *     description: Export safety incident records with month-based filtering. Supports JSON and CSV formats (set Accept header to text/csv for CSV).
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: "Month filter (YYYY-MM, default: last 30 days)"
 *       - in: query
 *         name: dept
 *         schema:
 *           type: string
 *         description: Department name filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Export data (JSON or CSV)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       incident_date:
 *                         type: string
 *                         format: date
 *                       incident_type:
 *                         type: string
 *                       severity:
 *                         type: string
 *                       status:
 *                         type: string
 *                       department_id:
 *                         type: string
 *                       description:
 *                         type: string
 *                 from:
 *                   type: string
 *                 to:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV file with safety incident data
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'
import { validateBody as _validateBody } from '@/lib/api/response'
import { applyCors } from '@/lib/api/cors'
import { safetyExportQuerySchema } from '@repo/contract'

function sanitizeCsvCell(value: string): string {
  const dangerous = /^[=+\-@\t\r]/
  const sanitized = dangerous.test(value) ? "'" + value : value
  return `"${sanitized.replace(/"/g, '""')}"`
}

async function handleExportRequest(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return applyCors(req, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  const { searchParams } = req.nextUrl
  const params = Object.fromEntries(searchParams.entries())
  const parsed = safetyExportQuerySchema.safeParse(params)
  if (!parsed.success) {
    return applyCors(
      req,
      NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      )
    )
  }
  const { month, dept, limit, offset } = parsed.data

  const format = req.headers.get('accept')?.includes('text/csv') ? 'csv' : 'json'

  const from = month
    ? `${month}-01`
    : new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!
  const to = month
    ? new Date(new Date(`${month}-01`).getFullYear(), new Date(`${month}-01`).getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]!
    : new Date().toISOString().split('T')[0]!

  let query = supabase
    .from('safety_incidents')
    .select('id, incident_date, incident_type, severity, status, department_id, description', {
      count: 'estimated',
    })
    .gte('incident_date', from)
    .lte('incident_date', to)
    .order('incident_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dept) {
    const { data: deptRow } = await supabase
      .from('departments')
      .select('id')
      .eq('name', dept)
      .single()
    if (deptRow) query = query.eq('department_id', deptRow.id)
  }

  const { data, error, count } = await query
  if (error) {
    return applyCors(req, NextResponse.json({ error: 'Database query failed' }, { status: 500 }))
  }

  if (format === 'csv') {
    const keys = [
      'id',
      'incident_date',
      'incident_type',
      'severity',
      'status',
      'department_id',
      'description',
    ] as const
    const csv = [
      keys.join(','),
      ...(data ?? []).map((r) => keys.map((k) => sanitizeCsvCell(String(r[k] ?? ''))).join(',')),
    ].join('\n')
    const response = new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="safety-incidents-${from}-${to}.csv"`,
      },
    })
    return applyCors(req, response)
  }

  const response = NextResponse.json({
    data,
    from,
    to,
    count: count ?? data?.length ?? 0,
    limit,
    offset,
  })
  return applyCors(req, response)
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, () => handleExportRequest(req))
}
