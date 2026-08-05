import type { SupabaseClient } from '@repo/supabase/types'

export interface ShiftCompletenessResult {
  statuses: Array<{
    machineName: string
    hasEntry: boolean
    exempt: boolean
  }>
}

/**
 * Get shift completeness for a department.
 *
 * Queries all active machines for the department and checks if they have
 * any logged entries in `hourly_loads` or `machine_operations` for the given
 * date and shift type.
 */
export async function getShiftCompleteness(
  supabase: unknown,
  departmentId: string,
  _areaId: string | null,
  date: string,
  shiftType: 'day' | 'night'
): Promise<ShiftCompletenessResult> {
  const client = supabase as SupabaseClient

  // 1. Fetch active machines for the department
  const { data: machines, error: machinesError } = await client
    .from('machines')
    .select('id, name, report_exempt')
    .eq('department_id', departmentId)
    .eq('active', true)

  if (machinesError) {
    throw new Error(`getShiftCompleteness failed to load machines: ${machinesError.message}`)
  }

  if (!machines || machines.length === 0) {
    return { statuses: [] }
  }

  // 2. Fetch hourly loads logged for today/shift in this department
  const { data: loads, error: loadsError } = await client
    .from('hourly_loads')
    .select('machine_id')
    .eq('department_id', departmentId)
    .eq('load_date', date)
    .eq('shift_type', shiftType)

  if (loadsError) {
    throw new Error(`getShiftCompleteness failed to load hourly loads: ${loadsError.message}`)
  }

  // 3. Fetch machine operations logged for today/shift in this department
  const { data: ops, error: opsError } = await client
    .from('machine_operations')
    .select('machine_id')
    .eq('department_id', departmentId)
    .eq('shift_date', date)
    .eq('shift_type', shiftType)

  if (opsError) {
    throw new Error(`getShiftCompleteness failed to load machine operations: ${opsError.message}`)
  }

  // 4. Set of machine IDs with entries
  const entryMachineIds = new Set<string>([
    ...(loads ?? []).map((l) => l.machine_id),
    ...(ops ?? []).map((o) => o.machine_id),
  ])

  // 5. Map to statuses
  const statuses = machines.map((m) => ({
    machineName: m.name,
    hasEntry: entryMachineIds.has(m.id),
    exempt: m.report_exempt ?? false,
  }))

  return { statuses }
}
