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
      .eq('activity_date', today),
    supabase
      .from('operational_delays')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('delay_date', today),
    supabase
      .from('engineering_notes')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('note_date', today),
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

export async function bookMachineBreakdown(
  machineId: string,
  machineName: string,
  machineType: string,
  reason: string
): Promise<{ success: boolean; id: string }> {
  const { supabase, user } = await assertControlRoomRole()

  if (!machineId || !machineName || !reason) {
    throw new ValidationError('Missing required fields for booking breakdown')
  }

  const today = new Date().toISOString().split('T')[0]
  const timeIn = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .eq('name', 'control-room')
    .single()

  const deptId = dept?.id
  if (!deptId) {
    throw new DatabaseError('Control Room department ID not found')
  }

  const { data, error } = await supabase
    .from('breakdowns')
    .insert({
      fleet_id: machineId,
      machine_name: machineName,
      machine_type: machineType,
      reason,
      status: 'active',
      date_in: today,
      time_in: timeIn,
      department_id: deptId,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new DatabaseError('Failed to log machine breakdown', {
      operation: 'insert',
      context: { error: error?.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true, id: data.id }
}

export async function endHaulingSession(
  loadRowId: string,
  stopHour: number,
  newMaterial: string,
  newExcavatorId: string
): Promise<{ success: boolean }> {
  const { supabase, user } = await assertControlRoomRole()

  if (!loadRowId || stopHour < 1 || stopHour > 12) {
    throw new ValidationError('Invalid request payload for ending hauling session')
  }

  // 1. Fetch current hourly load row
  const { data: currentLoad, error: readError } = await supabase
    .from('hourly_loads')
    .select('*')
    .eq('id', loadRowId)
    .single()

  if (readError || !currentLoad) {
    throw new DatabaseError('Hourly load record not found', {
      operation: 'select',
      context: { loadRowId, error: readError?.message },
    })
  }

  // 2. Lock remaining hours by setting them to -1 on the current row
  const updatedHours: Record<string, number> = {}
  let totalLoads = 0
  for (let i = 1; i <= 12; i++) {
    const col = `hour_${String(i).padStart(2, '0')}`
    if (i > stopHour) {
      updatedHours[col] = -1
    } else {
      const val = (currentLoad as Record<string, number>)[col] as number
      updatedHours[col] = val >= 0 ? val : 0
      totalLoads += updatedHours[col]
    }
  }

  const { error: updateError } = await supabase
    .from('hourly_loads')
    .update({
      ...updatedHours,
      total_loads: totalLoads,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', loadRowId)

  if (updateError) {
    throw new DatabaseError('Failed to end hauling session', {
      operation: 'update',
      context: { loadRowId, error: updateError.message },
    })
  }

  // 3. Create a new hourly load row, locking hours up to stopHour
  const newHours: Record<string, number> = {}
  for (let i = 1; i <= 12; i++) {
    const col = `hour_${String(i).padStart(2, '0')}`
    if (i <= stopHour) {
      newHours[col] = -1
    } else {
      newHours[col] = 0
    }
  }

  const { data: newLoad, error: insertError } = await supabase
    .from('hourly_loads')
    .insert({
      department_id: currentLoad.department_id,
      load_date: currentLoad.load_date,
      shift_type: currentLoad.shift_type,
      machine_id: currentLoad.machine_id,
      material_type: newMaterial,
      total_loads: 0,
      ...newHours,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !newLoad) {
    throw new DatabaseError('Failed to create new hauling session row', {
      operation: 'insert',
      context: { error: insertError?.message },
    })
  }

  // 4. Create a new assignment if a new excavator is selected
  if (newExcavatorId) {
    // Check if there is an active excavator_activity for this excavator today/shift
    let activityId: string | null = null
    const { data: activeActivity } = await supabase
      .from('excavator_activity')
      .select('id')
      .eq('machine_id', newExcavatorId)
      .eq('activity_date', currentLoad.load_date)
      .eq('shift_type', currentLoad.shift_type)
      .limit(1)

    if (activeActivity && activeActivity.length > 0 && activeActivity[0]) {
      activityId = activeActivity[0].id
    } else {
      // Create new excavator activity
      const { data: newActivity, error: activityError } = await supabase
        .from('excavator_activity')
        .insert({
          department_id: currentLoad.department_id,
          activity_date: currentLoad.load_date,
          shift_type: currentLoad.shift_type,
          machine_id: newExcavatorId,
          loads: 0,
          passes: 0,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (!activityError && newActivity) {
        activityId = newActivity.id
      }
    }

    if (activityId) {
      // Insert new assignment
      await supabase.from('excavator_dumper_assignments').insert({
        dumper_machine_id: currentLoad.machine_id,
        excavator_activity_id: activityId,
        material_type: newMaterial,
        total_loads: 0,
        updated_at: new Date().toISOString(),
      })
    }
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true }
}

export async function updateMachineSite(
  machineId: string,
  siteId: string | null
): Promise<{ success: boolean }> {
  const { supabase } = await assertControlRoomRole()

  if (!machineId) {
    throw new ValidationError('Missing machineId')
  }

  const { error } = await supabase
    .from('machines')
    .update({
      site_id: siteId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', machineId)

  if (error) {
    throw new DatabaseError('Failed to update machine site', {
      operation: 'update',
      context: { machineId, siteId, error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true }
}

export async function updateHourlyLoadMaterial(
  loadRowId: string,
  primaryMaterial: 'Coal' | 'Waste',
  subMaterial: string
): Promise<{ success: boolean }> {
  const { supabase, user } = await assertControlRoomRole()

  if (!loadRowId || !primaryMaterial || !subMaterial) {
    throw new ValidationError('Missing required fields for material update')
  }

  // 1. Update hourly loads material_type (restricted to 'Coal' | 'Waste')
  const { error: loadError } = await supabase
    .from('hourly_loads')
    .update({
      material_type: primaryMaterial,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', loadRowId)

  if (loadError) {
    throw new DatabaseError('Failed to update hourly load material type', {
      operation: 'update',
      context: { loadRowId, primaryMaterial, error: loadError.message },
    })
  }

  // 2. Fetch the corresponding excavator dumper assignment to update its specific material type
  const { data: loadRow } = await supabase
    .from('hourly_loads')
    .select('machine_id, load_date, shift_type')
    .eq('id', loadRowId)
    .single()

  if (loadRow) {
    // Find sibling loads
    const { data: siblingLoads } = await supabase
      .from('hourly_loads')
      .select('id')
      .eq('machine_id', loadRow.machine_id)
      .eq('load_date', loadRow.load_date)
      .eq('shift_type', loadRow.shift_type)
      .order('created_at')

    // Find assignments
    const { data: assignments } = await supabase
      .from('excavator_dumper_assignments')
      .select('id, created_at')
      .eq('dumper_machine_id', loadRow.machine_id)
      .order('created_at')

    if (siblingLoads && assignments) {
      const index = siblingLoads.findIndex((l) => l.id === loadRowId)
      if (index !== -1 && index < assignments.length && assignments[index]) {
        const assignmentId = assignments[index].id
        await supabase
          .from('excavator_dumper_assignments')
          .update({
            material_type: subMaterial,
            updated_at: new Date().toISOString(),
          })
          .eq('id', assignmentId)
      }
    }
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true }
}

export async function reassignDumperExcavator(
  loadRowId: string,
  newExcavatorId: string
): Promise<{ success: boolean }> {
  const { supabase } = await assertControlRoomRole()

  if (!loadRowId) {
    throw new ValidationError('Missing required loadRowId')
  }

  // 1. Fetch the hourly loads row
  const { data: loadRow, error: readError } = await supabase
    .from('hourly_loads')
    .select('machine_id, load_date, shift_type, material_type, department_id')
    .eq('id', loadRowId)
    .single()

  if (readError || !loadRow) {
    throw new DatabaseError('Hourly load record not found', {
      operation: 'select',
      context: { loadRowId, error: readError?.message },
    })
  }

  // 2. Find the corresponding assignment for this session row (using creation order matching)
  const { data: siblingLoads } = await supabase
    .from('hourly_loads')
    .select('id')
    .eq('machine_id', loadRow.machine_id)
    .eq('load_date', loadRow.load_date)
    .eq('shift_type', loadRow.shift_type)
    .order('created_at')

  const { data: assignments } = await supabase
    .from('excavator_dumper_assignments')
    .select('id, created_at')
    .eq('dumper_machine_id', loadRow.machine_id)
    .order('created_at')

  if (siblingLoads && assignments) {
    const index = siblingLoads.findIndex((l) => l.id === loadRowId)

    // Find or create active excavator activity for the new excavator
    let activityId: string | null = null
    if (newExcavatorId) {
      const { data: activeActivity } = await supabase
        .from('excavator_activity')
        .select('id')
        .eq('machine_id', newExcavatorId)
        .eq('activity_date', loadRow.load_date)
        .eq('shift_type', loadRow.shift_type)
        .limit(1)

      if (activeActivity && activeActivity.length > 0 && activeActivity[0]) {
        activityId = activeActivity[0].id
      } else {
        // Create new excavator activity
        const { data: newActivity, error: activityError } = await supabase
          .from('excavator_activity')
          .insert({
            department_id: loadRow.department_id,
            activity_date: loadRow.load_date,
            shift_type: loadRow.shift_type,
            machine_id: newExcavatorId,
            loads: 0,
            passes: 0,
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (!activityError && newActivity) {
          activityId = newActivity.id
        }
      }
    }

    if (index !== -1 && index < assignments.length && assignments[index]) {
      const assignmentId = assignments[index].id
      // Update existing assignment
      if (activityId) {
        await supabase
          .from('excavator_dumper_assignments')
          .update({
            excavator_activity_id: activityId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', assignmentId)
      } else {
        // If unassigned (empty select)
        await supabase.from('excavator_dumper_assignments').delete().eq('id', assignmentId)
      }
    } else if (activityId) {
      // If no assignment existed for this index, insert one!
      await supabase.from('excavator_dumper_assignments').insert({
        dumper_machine_id: loadRow.machine_id,
        excavator_activity_id: activityId,
        material_type: loadRow.material_type,
        total_loads: 0,
        updated_at: new Date().toISOString(),
      })
    }
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true }
}

export async function updateReportAssignedShift(
  reportId: string,
  shiftName: 'Shift A' | 'Shift B' | 'Shift C'
): Promise<{ success: boolean }> {
  const { supabase } = await assertControlRoomRole()

  if (!reportId || !shiftName) {
    throw new ValidationError('Missing reportId or shiftName')
  }

  // Fetch the report's current report_data
  const { data: report, error: fetchError } = await supabase
    .from('generated_reports')
    .select('report_data')
    .eq('id', reportId)
    .single()

  if (fetchError || !report) {
    throw new DatabaseError('Failed to fetch report details', {
      operation: 'select',
      context: { reportId, error: fetchError?.message },
    })
  }

  const currentData = (report.report_data || {}) as Record<string, unknown>
  const updatedData = { ...currentData, assigned_shift: shiftName }

  // Update report_data with assigned_shift
  const { error: updateError } = await supabase
    .from('generated_reports')
    .update({
      report_data: updatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (updateError) {
    throw new DatabaseError('Failed to update report shift assignment', {
      operation: 'update',
      context: { reportId, shiftName, error: updateError.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  return { success: true }
}
