export interface ShiftCompletenessResult {
  statuses: Array<{
    machineName: string
    hasEntry: boolean
    exempt: boolean
  }>
}

/**
 * Get shift completeness for a department.
 * Stub — returns empty statuses (no machines missing).
 *
 * Accepts `unknown` for supabase to avoid cross-package SupabaseClient
 * version mismatches. When implemented, cast to the appropriate client type.
 */
export async function getShiftCompleteness(
  _supabase: unknown,
  _departmentId: string,
  _areaId: string | null,
  _date: string,
  _shiftType: 'day' | 'night'
): Promise<ShiftCompletenessResult> {
  return { statuses: [] }
}
