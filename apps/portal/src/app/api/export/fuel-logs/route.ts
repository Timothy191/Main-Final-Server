/**
 * @swagger
 * /api/export/fuel-logs:
 *   get:
 *     summary: Export fuel logs
 *     description: Export fuel consumption logs with date range filtering. Supports JSON and CSV formats (set Accept header to text/csv for CSV).
 *     tags:
 *       - Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: "Start date (YYYY-MM-DD, default: 30 days ago)"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: "End date (YYYY-MM-DD, default: today)"
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
 *                       log_date:
 *                         type: string
 *                         format: date
 *                       shift:
 *                         type: string
 *                       department_id:
 *                         type: string
 *                       machine_id:
 *                         type: string
 *                       machine_name:
 *                         type: string
 *                       machine_type:
 *                         type: string
 *                       diesel_litres:
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
 *               description: CSV file with fuel log data
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
  const { from, to, dept, limit, offset } = parsed.data

  const fromDate = from ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!
  const toDate = to ?? new Date().toISOString().split('T')[0]!

  const format = req.headers.get('accept')?.includes('text/csv') ? 'csv' : 'json'

  let query = supabase
    .from('daily_logs')
    .select(
      'id, log_date, shift, department_id, fuel_logs(id, diesel_litres, machine_id, machines(name, machine_type))',
      { count: 'estimated' }
    )
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
    .order('log_date', { ascending: false })
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

  // Flatten fuel logs from daily_logs into rows for CSV export
  interface FuelLogEntry {
    id: string
    diesel_litres: number | null
    machine_id: string
    machines: { name: string | null; machine_type: string | null } | null
  }

  const rows: Array<Record<string, string>> = []
  const logs = (data ?? []) as unknown as Array<{
    log_date: string
    shift: string
    department_id: string
    fuel_logs: FuelLogEntry | FuelLogEntry[] | null
  }>
  for (const log of logs) {
    const fLogs: FuelLogEntry[] = Array.isArray(log.fuel_logs)
      ? (log.fuel_logs as FuelLogEntry[])
      : log.fuel_logs
        ? [log.fuel_logs as FuelLogEntry]
        : []
    for (const fl of fLogs) {
      const machineName = fl.machines?.name ?? 'Unknown'
      const machineType = fl.machines?.machine_type ?? 'Unknown'
      rows.push({
        id: fl.id,
        log_date: log.log_date,
        shift: log.shift,
        department_id: log.department_id,
        machine_id: fl.machine_id,
        machine_name: machineName,
        machine_type: machineType,
        diesel_litres: Number(fl.diesel_litres ?? 0).toFixed(2),
      })
    }
  }

  if (format === 'csv') {
    const headers = [
      'id',
      'log_date',
      'shift',
      'department_id',
      'machine_id',
      'machine_name',
      'machine_type',
      'diesel_litres',
    ]
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => sanitizeCsvCell(String(r[h as keyof typeof r] ?? ''))).join(',')
      ),
    ].join('\n')
    const response = new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fuel-logs-${fromDate}-${toDate}.csv"`,
      },
    })
    return applyCors(req, response)
  }

  const response = NextResponse.json({
    data: rows,
    from: fromDate,
    to: toDate,
    count: count ?? rows.length,
    limit,
    offset,
  })
  return applyCors(req, response)
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, () => handleExportRequest(req))
}
