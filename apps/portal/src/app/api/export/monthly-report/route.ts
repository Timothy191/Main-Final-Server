import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { DatabaseError } from '@/lib/errors/error-classes'

/* ── POST /api/export/monthly-report ─────────────────────────── */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { month, year, departmentId, format = 'json' } = await request.json()

    if (!month || !year) {
      return NextResponse.json({ error: 'month and year are required' }, { status: 400 })
    }

    // Build date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    // Fetch daily_logs for the month (flat query; child tables joined separately below)
    let query = supabase
      .from('daily_logs')
      .select('*, machines(*)')
      .gte('log_date', startDate)
      .lte('log_date', endDate)

    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data: logs, error } = await query
    if (error) throw new DatabaseError(error.message)

    // Fetch fuel_logs and production_logs separately (batched by daily_log_id)
    const logIds = (logs ?? []).map((l) => l.id)
    const [{ data: fuelLogsData }, { data: prodLogsData }] =
      logIds.length > 0
        ? await Promise.all([
            supabase.from('fuel_logs').select('*').in('daily_log_id', logIds),
            supabase.from('production_logs').select('*').in('daily_log_id', logIds),
          ])
        : [{ data: null }, { data: null }]

    const fuelByLogId = new Map<string, Record<string, unknown>[]>()
    for (const fl of fuelLogsData ?? []) {
      const arr = fuelByLogId.get(fl.daily_log_id) ?? []
      arr.push(fl as Record<string, unknown>)
      fuelByLogId.set(fl.daily_log_id, arr)
    }

    const prodByLogId = new Map<string, Record<string, unknown>[]>()
    for (const pl of prodLogsData ?? []) {
      const arr = prodByLogId.get(pl.daily_log_id) ?? []
      arr.push(pl as Record<string, unknown>)
      prodByLogId.set(pl.daily_log_id, arr)
    }

    const enrichedLogs = (logs ?? []).map((log) => ({
      ...log,
      fuel_logs: fuelByLogId.get(log.id) ?? [],
      production_logs: prodByLogId.get(log.id) ?? [],
    }))

    const report = {
      period: { month: Number(month), year: Number(year), startDate, endDate },
      departmentId: departmentId ?? 'all',
      generatedAt: new Date().toISOString(),
      totalLogs: enrichedLogs.length,
      summary: {
        totalFuel: 0,
        totalProduction: 0,
        totalMachineHours: 0,
      },
      logs: enrichedLogs,
    }

    // Calculate summary totals
    for (const log of report.logs) {
      const fuelLog = (log as Record<string, unknown>).fuel_logs as
        { litres?: number; diesel_litres?: number }[] | null
      const prodLog = (log as Record<string, unknown>).production_logs as
        { tonnes?: number; coal_tonnes?: number; waste_tonnes?: number }[] | null
      if (fuelLog)
        report.summary.totalFuel += fuelLog.reduce(
          (s, f) => s + (f.litres ?? f.diesel_litres ?? 0),
          0
        )
      if (prodLog)
        report.summary.totalProduction += prodLog.reduce(
          (s, p) => s + (p.tonnes ?? (p.coal_tonnes ?? 0) + (p.waste_tonnes ?? 0)),
          0
        )
    }

    if (format === 'csv') {
      // Simple CSV export of summary
      const csv = `Month,Year,Total Fuel (L),Total Production (t)\n${month},${year},${report.summary.totalFuel},${report.summary.totalProduction}`
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="monthly-report-${year}-${month}.csv"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
