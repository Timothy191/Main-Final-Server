/**
 * @swagger
 * /api/export/machines:
 *   get:
 *     summary: Export machines
 *     description: Export machine registry data with optional department filtering. Supports JSON and CSV formats (set Accept header to text/csv for CSV).
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *                       name:
 *                         type: string
 *                       machine_type:
 *                         type: string
 *                       serial_number:
 *                         type: string
 *                       bin_factor:
 *                         type: number
 *                       active:
 *                         type: boolean
 *                       department_id:
 *                         type: string
 *                       site_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV file with machine data
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
import { exportQuerySchema } from '@repo/contract'

function sanitizeCsvCell(value: string): string {
  const dangerous = /^[=+\-@\t\r]/
  const sanitized = dangerous.test(value) ? "'" + value : value
  return `"${sanitized.replace(/"/g, '""')}"`
}

async function handleExportRequest(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return applyCors(req, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  const { searchParams } = req.nextUrl
  const params = Object.fromEntries(searchParams.entries())
  const parsed = exportQuerySchema.safeParse(params)
  if (!parsed.success) {
    return applyCors(
      req,
      NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.issues },
        { status: 400 }
      )
    )
  }
  const { dept, limit, offset } = parsed.data

  const format = req.headers.get('accept')?.includes('text/csv') ? 'csv' : 'json'

  let query = supabase
    .from('machines')
    .select(
      'id, name, machine_type, serial_number, bin_factor, active, department_id, site_id, created_at',
      { count: 'estimated' }
    )
    .order('name')
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
      'name',
      'machine_type',
      'serial_number',
      'bin_factor',
      'active',
      'department_id',
      'site_id',
      'created_at',
    ] as const
    const csv = [
      keys.join(','),
      ...(data ?? []).map((r) => keys.map((k) => sanitizeCsvCell(String(r[k] ?? ''))).join(',')),
    ].join('\n')
    const response = new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="machines.csv"`,
      },
    })
    return applyCors(req, response)
  }

  const response = NextResponse.json({
    data,
    count: count ?? data?.length ?? 0,
    limit,
    offset,
  })
  return applyCors(req, response)
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, () => handleExportRequest(req))
}
