'use server'

import { cacheTag } from 'next/cache'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ControlRoomMetrics {
  activeMachineOps: number
  totalMachinesInOps: number
  excavatorsActive: number
  delaysToday: number
  shiftNotesToday: number
  totalTonnageToday: number
}

export interface RecentMachineOperation {
  id: string
  shiftDate: string
  shiftType: 'day' | 'night'
  machineName: string
  machineType: string
  hoursWorked: number | null
  siteName: string | null
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertControlRoomRole() {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Unauthorized')

  const { data: employee } = await supabase
    .from('employees')
    .select('role, department_id')
    .eq('auth_id', user.id)
    .single()

  if (!employee || !['admin', 'control_room', 'supervisor'].includes(employee.role)) {
    throw new ForbiddenError('Forbidden: control_room or admin role required', {
      resource: 'control-room',
      action: 'assert_role',
    })
  }

  return { supabase, user, employee }
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedControlRoomMetrics(deptId: string): Promise<ControlRoomMetrics> {
  'use cache'
  cacheTag(
    `dept:${deptId}`,
    'table:machine_operations',
    'table:excavator_activity',
    'table:operational_delays',
    'table:hourly_loads',
    'department-control-room',
    'department-dashboard'
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: activeMachineOps },
    { count: excavatorsActive },
    { count: delaysToday },
    { count: shiftNotesToday },
    { data: hourlyLoads },
  ] = await Promise.all([
    supabase
      .from('machine_operations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('shift_date', today)
      .is('end_time', null),
    supabase
      .from('excavator_activity')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('shift_date', today),
    supabase
      .from('operational_delays')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('delay_date', today),
    supabase
      .from('shift_notes')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('shift_date', today),
    supabase
      .from('hourly_loads')
      .select(
        'hour_00,hour_01,hour_02,hour_03,hour_04,hour_05,hour_06,hour_07,hour_08,hour_09,hour_10,hour_11,hour_12,hour_13,hour_14,hour_15,hour_16,hour_17,hour_18,hour_19,hour_20,hour_21,hour_22,hour_23'
      )
      .eq('department_id', deptId)
      .eq('load_date', today),
  ])

  // Sum all hourly loads for today's total tonnage
  const totalTonnageToday = (hourlyLoads ?? []).reduce((sum, row) => {
    return (
      sum +
      Object.values(row as Record<string, number>).reduce(
        (h, v) => h + (typeof v === 'number' ? v : 0),
        0
      )
    )
  }, 0)

  // Get distinct machine count for active ops
  const { data: distinctMachines } = await supabase
    .from('machine_operations')
    .select('machine_id')
    .eq('department_id', deptId)
    .eq('shift_date', today)

  const totalMachinesInOps = new Set((distinctMachines ?? []).map((r) => r.machine_id)).size

  return {
    activeMachineOps: activeMachineOps ?? 0,
    totalMachinesInOps,
    excavatorsActive: excavatorsActive ?? 0,
    delaysToday: delaysToday ?? 0,
    shiftNotesToday: shiftNotesToday ?? 0,
    totalTonnageToday,
  }
}

export async function getControlRoomMetrics(deptId: string): Promise<ControlRoomMetrics> {
  await assertControlRoomRole()
  return _getCachedControlRoomMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Recent Machine Operations (not cached — live activity)         */
/* ------------------------------------------------------------------ */

export async function getRecentMachineOperations(
  deptId: string,
  limit = 8
): Promise<RecentMachineOperation[]> {
  const { supabase } = await assertControlRoomRole()

  const { data, error } = await supabase
    .from('machine_operations')
    .select(
      `
      id,
      shift_date,
      shift_type,
      hours_worked,
      machine:machines!inner(name, machine_type),
      site:sites(name)
    `
    )
    .eq('department_id', deptId)
    .order('shift_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load machine operations', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as unknown as {
      id: string
      shift_date: string
      shift_type: 'day' | 'night'
      hours_worked: number | null
      machine: { name: string; machine_type: string }
      site: { name: string } | null
    }[]
  ).map((row) => ({
    id: row.id,
    shiftDate: row.shift_date,
    shiftType: row.shift_type,
    machineName: row.machine.name,
    machineType: row.machine.machine_type,
    hoursWorked: row.hours_worked,
    siteName: row.site?.name ?? null,
  }))
}
