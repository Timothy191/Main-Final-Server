'use server'

import { revalidateTag } from 'next/cache'
import { cacheTag, cacheLife } from 'next/cache'
import { z } from 'zod'
import { DatabaseError, ValidationError, ForbiddenError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

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

export interface AdjustHourlyLoadResult {
  success: boolean
  newValue: number
  totalLoads: number
}

const HOUR_COLUMNS = [
  'hour_01',
  'hour_02',
  'hour_03',
  'hour_04',
  'hour_05',
  'hour_06',
  'hour_07',
  'hour_08',
  'hour_09',
  'hour_10',
  'hour_11',
  'hour_12',
] as const

const AdjustHourlyLoadSchema = z.object({
  id: z.string().uuid(),
  hourColumn: z.enum(HOUR_COLUMNS),
  delta: z.union([z.literal(1), z.literal(-1)]),
})

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertControlRoomRole() {
  return assertDeptRole(['admin', 'control_room', 'supervisor'], 'control-room')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedControlRoomMetrics(deptId: string): Promise<ControlRoomMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.CONTROL_ROOM,
    DEPARTMENT_CACHE_TAGS.TABLE_MACHINES,
    `dept:control-room:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: activeMachineOps },
    { count: excavatorsActive },
    { count: delaysToday },
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
      .eq('activity_date', today),
    supabase
      .from('operational_delays')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('delay_date', today),
    supabase
      .from('hourly_loads')
      .select(
        'hour_01,hour_02,hour_03,hour_04,hour_05,hour_06,hour_07,hour_08,hour_09,hour_10,hour_11,hour_12'
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
    shiftNotesToday: 0,
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

/* ------------------------------------------------------------------ */
/*  3. Adjust an hourly load count (+/- 1)                            */
/* ------------------------------------------------------------------ */

export async function adjustHourlyLoad(formData: unknown): Promise<AdjustHourlyLoadResult> {
  const { supabase, user } = await assertControlRoomRole()

  const parseResult = AdjustHourlyLoadSchema.safeParse(formData)
  if (!parseResult.success) {
    throw new ValidationError('Invalid hourly load adjustment payload', {
      issues: parseResult.error.flatten().fieldErrors,
    })
  }

  const { id, hourColumn, delta } = parseResult.data

  // Read current row and verify ownership via department membership
  const { data: row, error: readError } = await supabase
    .from('hourly_loads')
    .select('department_id, total_loads, ' + hourColumn)
    .eq('id', id)
    .single()

  if (readError || !row) {
    throw new DatabaseError('Hourly load record not found', {
      operation: 'select',
      context: { id, error: readError?.message },
    })
  }

  const typedRow = row as unknown as Record<string, number | string>
  const currentValue = typedRow[hourColumn] as number
  const newValue = currentValue + delta

  if (newValue < 0) {
    throw new ForbiddenError('Cannot decrement hourly load below zero', {
      resource: 'hourly_loads',
      action: 'adjust',
    })
  }

  const newTotalLoads = ((typedRow.total_loads as number) ?? 0) + delta

  const { data: updated, error: updateError } = await supabase
    .from('hourly_loads')
    .update({
      [hourColumn]: newValue,
      total_loads: newTotalLoads,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', id)
    .select('total_loads, ' + hourColumn)
    .single()

  if (updateError || !updated) {
    throw new DatabaseError('Failed to update hourly load', {
      operation: 'update',
      context: { id, error: updateError?.message },
    })
  }

  const typedUpdated = updated as unknown as Record<string, number>

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return {
    success: true,
    newValue: typedUpdated[hourColumn] as number,
    totalLoads: typedUpdated.total_loads as number,
  }
}

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
