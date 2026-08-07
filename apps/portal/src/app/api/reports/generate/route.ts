import { NextResponse } from 'next/server'
import { createAdminClient } from '@repo/supabase/server'

export async function POST(request: Request) {
  try {
    const { reportName, reportType, signedBy } = await request.json()

    const supabase = await createAdminClient()

    // 1. Get Control Room department
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('slug', 'control-room')
      .single()

    const departmentId = dept?.id
    if (!departmentId) {
      return NextResponse.json({ error: 'Control room department not found' }, { status: 500 })
    }

    const today = new Date().toISOString().split('T')[0]

    // 2. Query metrics directly (matches actions.ts)
    const [
      activeMachineOpsResult,
      excavatorsActiveResult,
      delaysTodayResult,
      shiftNotesTodayResult,
      hourlyLoadsResult,
      distinctMachinesResult,
    ] = await Promise.all([
      supabase
        .from('machine_operations')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', departmentId)
        .is('actual_end_time', null),
      supabase
        .from('excavator_activity')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', departmentId)
        .eq('activity_date', today),
      supabase
        .from('operational_delays')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', departmentId)
        .eq('delay_date', today),
      supabase
        .from('engineering_notes')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', departmentId)
        .eq('note_date', today),
      supabase
        .from('hourly_loads')
        .select(
          'hour_01,hour_02,hour_03,hour_04,hour_05,hour_06,hour_07,hour_08,hour_09,hour_10,hour_11,hour_12'
        )
        .eq('department_id', departmentId)
        .eq('load_date', today),
      supabase
        .from('machine_operations')
        .select('machine_id')
        .eq('department_id', departmentId)
        .eq('shift_date', today),
    ])

    const activeMachineOps = activeMachineOpsResult.count ?? 0
    const excavatorsActive = excavatorsActiveResult.count ?? 0
    const delaysToday = delaysTodayResult.count ?? 0
    const shiftNotesToday = shiftNotesTodayResult.count ?? 0
    const hourlyLoads = hourlyLoadsResult.data ?? []
    const distinctMachines = distinctMachinesResult.data ?? []

    // Calculate total tonnage
    const totalTonnageToday = hourlyLoads.reduce((sum: number, row: Record<string, unknown>) => {
      return (
        sum +
        Object.values(row as Record<string, number>).reduce(
          (h, v) => h + (typeof v === 'number' ? v : 0),
          0
        )
      )
    }, 0)

    const totalMachinesInOps = new Set(
      distinctMachines.map((r: { machine_id: string }) => r.machine_id)
    ).size

    const metrics = {
      activeMachineOps,
      totalMachinesInOps,
      excavatorsActive,
      delaysToday,
      shiftNotesToday,
      totalTonnageToday,
    }

    const name = reportName || `Shift-Report-${today}`
    const type = reportType || 'shift-summary'
    const filePath = `/storage/reports/${name}.pdf` // Mock file path for PDF

    // 3. Insert report into generated_reports
    const { data: report, error } = await supabase
      .from('generated_reports')
      .insert({
        department_id: departmentId,
        report_name: name,
        report_type: type,
        file_path: filePath,
        metrics,
        signed_by: signedBy || null,
        signature_date: signedBy ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
