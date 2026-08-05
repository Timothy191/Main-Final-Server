'use server'

import { revalidateTag } from 'next/cache'
import { cacheTag, cacheLife } from 'next/cache'
import { cache } from 'react'
import { z } from 'zod'
import { DatabaseError, ValidationError, ForbiddenError } from '@/lib/errors/error-classes'
import { assertDeptRole, type RoleAuthResult } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'
import { serverLogger } from '@repo/logger'

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

// An excavator selection may be a real platform UUID or an empty string used
// to signal "unassign" from the hourly-loads excavator <select>.
const ExcavatorIdField = z.union([z.string().uuid(), z.literal('')])

const BookMachineBreakdownSchema = z.object({
  machineId: z.string().uuid(),
  machineName: z.string().trim().min(1, 'Machine name is required'),
  machineType: z.string().trim().min(1, 'Machine type is required'),
  reason: z.string().trim().min(1, 'Breakdown reason is required'),
})

const UpdateMachineSiteSchema = z.object({
  machineId: z.string().uuid(),
  siteId: z.union([z.string().uuid(), z.null()]),
})

const UpdateHourlyLoadMaterialSchema = z.object({
  loadRowId: z.string().uuid(),
  primaryMaterial: z.enum(['Coal', 'Waste']),
  subMaterial: z.string().trim().min(1, 'Specific material is required').max(200),
})

const EndHaulingSessionSchema = z.object({
  loadRowId: z.string().uuid(),
  stopHour: z.number().int().min(1, 'Stop hour must be 1-12').max(12),
  newMaterial: z.string().trim().min(1, 'New material is required').max(200),
  newExcavatorId: ExcavatorIdField,
})

const ReassignDumperExcavatorSchema = z.object({
  loadRowId: z.string().uuid(),
  newExcavatorId: ExcavatorIdField,
})

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

/* AGENT-TRACE: All control-room write actions funnel user-supplied inputs
 * through `parseSchema` (shared Zod schemas above). Keep every new action's
 * inputs in a schema here so validation stays consistent and testable. The
 * multi-write flows (endHaulingSession, reassignDumperExcavator,
 * updateHourlyLoadMaterial) are intentionally non-atomic at the JS layer;
 * wrap them in a Postgres rpc() function/migration for true atomicity. */

/** Parse an unknown payload against a schema, throwing a typed ValidationError. */
function parseSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError('Invalid request payload', {
      issues: result.error.flatten().fieldErrors,
    })
  }
  return result.data
}

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

  const input = parseSchema(BookMachineBreakdownSchema, {
    machineId,
    machineName,
    machineType,
    reason,
  })

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
      fleet_id: input.machineId,
      machine_name: input.machineName,
      machine_type: input.machineType,
      reason: input.reason,
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

  const input = parseSchema(EndHaulingSessionSchema, {
    loadRowId,
    stopHour,
    newMaterial,
    newExcavatorId,
  })

  const { data, error } = await supabase.rpc('control_room_end_hauling_session', {
    p_load_row_id: input.loadRowId,
    p_stop_hour: input.stopHour,
    p_new_material: input.newMaterial,
    p_new_excavator_id: input.newExcavatorId || null,
    p_user_id: user.id,
  })

  if (error || (data && !data.success)) {
    throw new DatabaseError('Failed to end hauling session', {
      operation: 'rpc:control_room_end_hauling_session',
      context: { loadRowId: input.loadRowId, error: error?.message || data?.error },
    })
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

  const input = parseSchema(UpdateMachineSiteSchema, { machineId, siteId })

  const { error } = await supabase
    .from('machines')
    .update({
      site_id: input.siteId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.machineId)

  if (error) {
    throw new DatabaseError('Failed to update machine site', {
      operation: 'update',
      context: { machineId: input.machineId, siteId: input.siteId, error: error.message },
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

  const input = parseSchema(UpdateHourlyLoadMaterialSchema, {
    loadRowId,
    primaryMaterial,
    subMaterial,
  })

  const { data, error } = await supabase.rpc('control_room_update_material', {
    p_load_row_id: input.loadRowId,
    p_primary_material: input.primaryMaterial,
    p_sub_material: input.subMaterial,
    p_user_id: user.id,
  })

  if (error || (data && !data.success)) {
    throw new DatabaseError('Failed to update hourly load material', {
      operation: 'rpc:control_room_update_material',
      context: { loadRowId: input.loadRowId, error: error?.message || data?.error },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true }
}

export async function reassignDumperExcavator(
  loadRowId: string,
  newExcavatorId: string
): Promise<{ success: boolean }> {
  const { supabase, user } = await assertControlRoomRole()

  const input = parseSchema(ReassignDumperExcavatorSchema, { loadRowId, newExcavatorId })

  const { data, error } = await supabase.rpc('control_room_reassign_excavator', {
    p_load_row_id: input.loadRowId,
    p_new_excavator_id: input.newExcavatorId || null,
    p_user_id: user.id,
  })

  if (error || (data && !data.success)) {
    throw new DatabaseError('Failed to reassign excavator', {
      operation: 'rpc:control_room_reassign_excavator',
      context: { loadRowId: input.loadRowId, error: error?.message || data?.error },
    })
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

/* ------------------------------------------------------------------ */
/*  6. SMR-based Machine Operations shift sheet                       */
/* ------------------------------------------------------------------ */

export interface MachineOperationSmrRow {
  id: string | null
  machineId: string
  machineName: string
  machineType: string
  siteId: string | null
  siteName: string | null
  operatorId: string | null
  operatorName: string | null
  startSMR: number | null
  closeSMR: number | null
  smrTotal: number | null
  naturalDelayMinutes: number
  nonProductionDelayMinutes: number
  productionDelayMinutes: number
  engineeringDelayMinutes: number
  // Standard 1-hour downtime buckets, present for every machine until changed.
  lunchDelayMinutes: number
  safetyTalkDelayMinutes: number
  getDieselDelayMinutes: number
  shiftDate: string
  shiftType: 'day' | 'night'
  startTime: string | null
  endTime: string | null
  utilizationPct: number | null
  availabilityPct: number | null
}

export interface SmrMetricInput {
  startSMR: number | null
  closeSMR: number | null
  engineeringDelayMinutes: number
}

export interface MachineOperationOptions {
  sites: { id: string; name: string }[]
  operators: { id: string; fullName: string }[]
}

const UpsertMachineOpSchema = z.object({
  machineId: z.string().uuid(),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Shift date must be YYYY-MM-DD'),
  shiftType: z.enum(['day', 'night']),
  siteId: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
  operatorId: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
  startSMR: z.number().nonnegative().nullable(),
  closeSMR: z.number().nonnegative().nullable(),
  naturalDelayMinutes: z.number().int().min(0).default(0),
  nonProductionDelayMinutes: z.number().int().min(0).default(0),
  productionDelayMinutes: z.number().int().min(0).default(0),
  engineeringDelayMinutes: z.number().int().min(0).default(0),
  lunchDelayMinutes: z.number().int().min(0).default(1),
  safetyTalkDelayMinutes: z.number().int().min(0).default(1),
  getDieselDelayMinutes: z.number().int().min(0).default(1),
})

const CloseMachineOpSchema = z.object({
  id: z.string().uuid(),
  closeSMR: z.number().nonnegative(),
})

/**
 * Calculate SMR-derived metrics for a shift row.
 * Total = closeSMR - startSMR
 * Utilization = smrTotal / 12h * 100
 * Availability = (smrTotal - engineeringDelayHours) / smrTotal * 100
 */
export function calculateSmrMetrics(input: SmrMetricInput): {
  smrTotal: number | null
  utilizationPct: number | null
  availabilityPct: number | null
} {
  const { startSMR, closeSMR, engineeringDelayMinutes } = input
  if (startSMR == null || closeSMR == null) {
    return { smrTotal: null, utilizationPct: null, availabilityPct: null }
  }
  const smrTotal = closeSMR - startSMR
  if (smrTotal <= 0) {
    return { smrTotal, utilizationPct: 0, availabilityPct: 0 }
  }
  const utilizationPct = (smrTotal / 12) * 100
  const availabilityPct = ((smrTotal - engineeringDelayMinutes / 60) / smrTotal) * 100
  return {
    smrTotal,
    utilizationPct: Math.min(100, Math.max(0, utilizationPct)),
    availabilityPct: Math.min(100, Math.max(0, availabilityPct)),
  }
}

async function resolveStartSmr(
  supabase: RoleAuthResult['supabase'],
  machine: { id: string; current_smr: number | null }
): Promise<number | null> {
  if (machine.current_smr != null) {
    return machine.current_smr
  }
  const { data: previous } = await supabase.rpc('get_machine_previous_close_smr', {
    p_machine_id: machine.id,
  })
  return previous ?? null
}

/**
 * Mirror an engineering-related delay from the Control Room machine-ops shift
 * sheet into the Engineering department's `engineering_notes` table. This keeps
 * a single source of truth: a breakdown logged in Control Room also shows up in
 * Engineering's history/breakdown views.
 *
 * AGENT-TRACE: notes are idempotent per (machine, shift) — re-saving the same
 * shift sheet upserts rather than duplicating. Resolution of the engineering
 * department id is best-effort (soft-skipped if the dept isn't found).
 */
async function mirrorEngineeringDelay(
  supabase: RoleAuthResult['supabase'],
  args: {
    machineId: string
    departmentId: string
    shiftDate: string
    shiftType: 'day' | 'night'
    minutes: number
    createdBy: string
  }
): Promise<void> {
  const { data: engDept } = await supabase
    .from('departments')
    .select('id')
    .eq('name', 'engineering')
    .single()

  if (!engDept) return // Engineering department not present — soft skip

  const { data: machine } = await supabase
    .from('machines')
    .select('name')
    .eq('id', args.machineId)
    .single()

  const machineName = machine?.name ?? args.machineId
  const description = `Engineering delay of ${args.minutes} min mirrored from Control Room machine-ops (${args.shiftType} shift, ${args.shiftDate}) for ${machineName}.`

  const { error } = await supabase.from('engineering_notes').upsert(
    {
      department_id: engDept.id,
      note_date: args.shiftDate,
      shift_type: args.shiftType,
      issue_type: 'mechanical',
      severity: 'medium',
      machine_id: args.machineId,
      description,
      action_taken: 'Logged from Control Room shift sheet (engineering delay bucket).',
      status: 'open',
      created_by: args.createdBy,
    },
    {
      // One mirrored note per machine/shift/day.
      onConflict: 'department_id, machine_id, note_date, shift_type',
    }
  )

  if (error) {
    // Non-fatal: the primary machine-ops write already succeeded. Log only.
    serverLogger().warn('Failed to mirror engineering delay to Engineering dept', {
      machineId: args.machineId,
      error: error.message,
    })
  }
}

/**
 * Load all active machines for a department, merged with any existing
 * machine_operations rows for the selected shift. Returns rows ready for
 * the SMR shift sheet, including auto-calculated utilization/availability.
 */
export const getMachineOperationsForShift = cache(
  async (
    deptId: string,
    shiftDate: string,
    shiftType: 'day' | 'night'
  ): Promise<MachineOperationSmrRow[]> => {
    const { supabase } = await assertControlRoomRole()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(shiftDate)) {
      throw new ValidationError('Invalid shift date', {
        issues: { shiftDate: ['YYYY-MM-DD required'] },
      })
    }

    const [{ data: machines, error: machinesError }, { data: operations, error: opsError }] =
      await Promise.all([
        supabase
          .from('machines')
          .select('id, name, machine_type, site_id, current_smr')
          .eq('department_id', deptId)
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('machine_operations')
          .select(
            'id, machine_id, site_id, operator_id, start_smr, close_smr, smr_total, natural_delay_minutes, non_production_delay_minutes, production_delay_minutes, engineering_delay_minutes, lunch_delay_minutes, safety_talk_delay_minutes, get_diesel_delay_minutes, shift_date, shift_type, start_time, end_time'
          )
          .eq('department_id', deptId)
          .eq('shift_date', shiftDate)
          .eq('shift_type', shiftType)
          .order('start_time', { ascending: false }),
      ])

    if (machinesError) {
      throw new DatabaseError('Failed to load machines', {
        operation: 'select',
        context: { deptId, error: machinesError.message },
      })
    }
    if (opsError) {
      throw new DatabaseError('Failed to load machine operations', {
        operation: 'select',
        context: { deptId, shiftDate, shiftType, error: opsError.message },
      })
    }

    const machineRows = (machines ?? []) as {
      id: string
      name: string
      machine_type: string
      site_id: string | null
      current_smr: number | null
    }[]

    const operationRows = (operations ?? []) as {
      id: string
      machine_id: string
      site_id: string | null
      operator_id: string | null
      start_smr: number | null
      close_smr: number | null
      smr_total: number | null
      natural_delay_minutes: number
      non_production_delay_minutes: number
      production_delay_minutes: number
      engineering_delay_minutes: number
      lunch_delay_minutes: number | null
      safety_talk_delay_minutes: number | null
      get_diesel_delay_minutes: number | null
      shift_date: string
      shift_type: 'day' | 'night'
      start_time: string | null
      end_time: string | null
    }[]

    const opByMachine = new Map(operationRows.map((op) => [op.machine_id, op]))

    const siteIds = new Set<string>()
    const operatorIds = new Set<string>()
    machineRows.forEach((m) => {
      if (m.site_id) siteIds.add(m.site_id)
    })
    operationRows.forEach((op) => {
      if (op.site_id) siteIds.add(op.site_id)
      if (op.operator_id) operatorIds.add(op.operator_id)
    })

    const [{ data: sites }, { data: operators }] = await Promise.all([
      siteIds.size > 0
        ? supabase.from('sites').select('id, name').in('id', Array.from(siteIds))
        : Promise.resolve({ data: [] } as { data: { id: string; name: string }[] | null }),
      operatorIds.size > 0
        ? supabase.from('operators').select('id, full_name').in('id', Array.from(operatorIds))
        : Promise.resolve({ data: [] } as { data: { id: string; full_name: string }[] | null }),
    ])

    const siteById = new Map((sites ?? []).map((s) => [s.id, s.name]))
    const operatorById = new Map((operators ?? []).map((o) => [o.id, o.full_name]))

    const rows: MachineOperationSmrRow[] = await Promise.all(
      machineRows.map(async (machine) => {
        const op = opByMachine.get(machine.id)
        const startSMR = op?.start_smr ?? (await resolveStartSmr(supabase, machine))
        const closeSMR = op?.close_smr ?? null
        const metrics = calculateSmrMetrics({
          startSMR,
          closeSMR,
          engineeringDelayMinutes: op?.engineering_delay_minutes ?? 0,
        })

        return {
          id: op?.id ?? null,
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.machine_type,
          siteId: op?.site_id ?? machine.site_id ?? null,
          siteName: siteById.get(op?.site_id ?? machine.site_id ?? '') ?? null,
          operatorId: op?.operator_id ?? null,
          operatorName: op?.operator_id ? (operatorById.get(op.operator_id) ?? null) : null,
          startSMR,
          closeSMR,
          smrTotal: metrics.smrTotal ?? op?.smr_total ?? null,
          naturalDelayMinutes: op?.natural_delay_minutes ?? 0,
          nonProductionDelayMinutes: op?.non_production_delay_minutes ?? 0,
          productionDelayMinutes: op?.production_delay_minutes ?? 0,
          engineeringDelayMinutes: op?.engineering_delay_minutes ?? 0,
          lunchDelayMinutes: op?.lunch_delay_minutes ?? 1,
          safetyTalkDelayMinutes: op?.safety_talk_delay_minutes ?? 1,
          getDieselDelayMinutes: op?.get_diesel_delay_minutes ?? 1,
          shiftDate,
          shiftType,
          startTime: op?.start_time ?? null,
          endTime: op?.end_time ?? null,
          utilizationPct: metrics.utilizationPct,
          availabilityPct: metrics.availabilityPct,
        }
      })
    )

    return rows
  }
)

/**
 * Load sites and operators for the machine operations shift sheet dropdowns.
 */
export const getMachineOperationOptions = cache(
  async (_deptId: string): Promise<MachineOperationOptions> => {
    const { supabase } = await assertControlRoomRole()

    const [{ data: sites }, { data: operators }] = await Promise.all([
      supabase.from('sites').select('id, name').eq('active', true).order('name'),
      supabase.from('operators').select('id, full_name').eq('active', true).order('full_name'),
    ])

    return {
      sites: (sites ?? []).map((s) => ({ id: s.id, name: s.name })),
      operators: (operators ?? []).map((o) => ({ id: o.id, fullName: o.full_name })),
    }
  }
)

/**
 * Create or update a machine operation row for the shift.
 * If closeSMR is supplied the row is treated as closed and the machine
 * current_smr cache is updated automatically.
 */
export async function upsertMachineOperation(formData: unknown): Promise<{
  success: boolean
  id: string
}> {
  const { supabase, user } = await assertControlRoomRole()
  const input = parseSchema(UpsertMachineOpSchema, formData)

  const siteId = input.siteId === '' ? null : (input.siteId ?? null)
  const operatorId = input.operatorId === '' ? null : (input.operatorId ?? null)

  const nowIso = new Date().toISOString()

  const machineDept = await supabase
    .from('machines')
    .select('department_id')
    .eq('id', input.machineId)
    .single()

  if (machineDept.error || !machineDept.data) {
    throw new DatabaseError('Machine not found', {
      operation: 'select',
      context: { machineId: input.machineId, error: machineDept.error?.message },
    })
  }

  const closeSMR = input.closeSMR
  const isClosing = closeSMR != null
  if (isClosing && input.startSMR != null && closeSMR < input.startSMR) {
    throw new ValidationError('Close SMR cannot be less than start SMR', {
      issues: { closeSMR: ['Must be greater than or equal to start SMR'] },
    })
  }

  const row = {
    machine_id: input.machineId,
    department_id: machineDept.data.department_id,
    shift_date: input.shiftDate,
    shift_type: input.shiftType,
    start_time: '00:00:00',
    site_id: siteId,
    operator_id: operatorId,
    start_smr: input.startSMR,
    close_smr: closeSMR,
    end_time: isClosing ? nowIso : null,
    natural_delay_minutes: input.naturalDelayMinutes,
    non_production_delay_minutes: input.nonProductionDelayMinutes,
    production_delay_minutes: input.productionDelayMinutes,
    engineering_delay_minutes: input.engineeringDelayMinutes,
    // AGENT-TRACE: standard 1-hour downtime buckets. Default 1h each; the
    // operator may lower/raise them per shift. These are always recorded so
    // availability math is consistent for every machine.
    lunch_delay_minutes: input.lunchDelayMinutes,
    safety_talk_delay_minutes: input.safetyTalkDelayMinutes,
    get_diesel_delay_minutes: input.getDieselDelayMinutes,
    created_by: user.id,
    updated_at: nowIso,
  }

  const { data: result, error } = await supabase
    .from('machine_operations')
    .upsert(row, { onConflict: 'machine_id, shift_date, shift_type' })
    .select('id')
    .single()

  if (error || !result) {
    throw new DatabaseError('Failed to save machine operation', {
      operation: 'upsert',
      context: { machineId: input.machineId, error: error?.message },
    })
  }

  // AGENT-TRACE: any engineering-related delay (breakdown / mechanical /
  // electrical / hydraulic) is mirrored into the Engineering department's
  // engineering_notes so both departments share one source of truth.
  const engineeringDelay = input.engineeringDelayMinutes ?? 0
  if (engineeringDelay > 0) {
    await mirrorEngineeringDelay(supabase, {
      machineId: input.machineId,
      departmentId: machineDept.data.department_id,
      shiftDate: input.shiftDate,
      shiftType: input.shiftType,
      minutes: engineeringDelay,
      createdBy: user.id,
    })
  }

  if (isClosing) {
    await supabase
      .from('machines')
      .update({ current_smr: closeSMR, updated_at: nowIso })
      .eq('id', input.machineId)
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true, id: result.id }
}

/**
 * Close out a shift operation by recording the close SMR and end time,
 * then cache the close SMR on machines.current_smr.
 */
export async function closeMachineOperation(
  id: string,
  closeSMR: number
): Promise<{ success: boolean }> {
  const { supabase } = await assertControlRoomRole()
  const input = parseSchema(CloseMachineOpSchema, { id, closeSMR })

  const nowIso = new Date().toISOString()

  const { data: existing } = await supabase
    .from('machine_operations')
    .select('machine_id, start_smr')
    .eq('id', input.id)
    .single()

  if (!existing) {
    throw new DatabaseError('Machine operation not found', {
      operation: 'select',
      context: { id: input.id },
    })
  }

  if (existing.start_smr != null && input.closeSMR < existing.start_smr) {
    throw new ValidationError('Close SMR cannot be less than start SMR', {
      issues: { closeSMR: ['Must be greater than or equal to start SMR'] },
    })
  }

  const { error: updateError } = await supabase
    .from('machine_operations')
    .update({
      close_smr: input.closeSMR,
      end_time: nowIso,
      updated_at: nowIso,
    })
    .eq('id', input.id)

  if (updateError) {
    throw new DatabaseError('Failed to close machine operation', {
      operation: 'update',
      context: { id: input.id, error: updateError.message },
    })
  }

  const { error: machineError } = await supabase
    .from('machines')
    .update({ current_smr: input.closeSMR, updated_at: nowIso })
    .eq('id', existing.machine_id)

  if (machineError) {
    throw new DatabaseError('Failed to update machine current SMR cache', {
      operation: 'update',
      context: { machineId: existing.machine_id, error: machineError.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES, 'max')

  return { success: true }
}
