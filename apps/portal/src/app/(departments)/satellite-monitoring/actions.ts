'use server'

import { cacheTag } from 'next/cache'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SatelliteMetrics {
  totalSensors: number
  activeSensors: number
  recentLogsCount: number
  lastLogDate: string | null
  machineTypes: { type: string; count: number; active: number }[]
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertSatelliteRole() {
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

  if (!employee || !['admin', 'satellite', 'supervisor'].includes(employee.role)) {
    throw new ForbiddenError('Forbidden: satellite or admin role required', {
      resource: 'satellite-monitoring',
      action: 'assert_role',
    })
  }

  return { supabase, user, employee }
}

/* ------------------------------------------------------------------ */
/*  1. Sensor/Instrument Inventory Metrics (cached)                   */
/* ------------------------------------------------------------------ */

async function _getCachedSatelliteMetrics(deptId: string): Promise<SatelliteMetrics> {
  'use cache'
  cacheTag(
    `dept:${deptId}`,
    'table:machines',
    'table:daily_logs',
    'department-satellite',
    'department-dashboard'
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [{ data: allMachines, error: machinesError }, { data: recentLogs, error: logsError }] =
    await Promise.all([
      supabase.from('machines').select('id, machine_type, active').eq('department_id', deptId),
      supabase
        .from('daily_logs')
        .select('id, log_date')
        .eq('department_id', deptId)
        .order('log_date', { ascending: false })
        .limit(30),
    ])

  if (machinesError) {
    throw new DatabaseError('Failed to load satellite sensors', {
      operation: 'select',
      context: { error: machinesError.message },
    })
  }
  if (logsError) {
    throw new DatabaseError('Failed to load satellite logs', {
      operation: 'select',
      context: { error: logsError.message },
    })
  }

  const machines = allMachines ?? []
  const logs = recentLogs ?? []

  // Group by machine type
  const typeMap = new Map<string, { count: number; active: number }>()
  for (const m of machines as { id: string; machine_type: string; active: boolean }[]) {
    const entry = typeMap.get(m.machine_type) ?? { count: 0, active: 0 }
    entry.count++
    if (m.active) entry.active++
    typeMap.set(m.machine_type, entry)
  }

  return {
    totalSensors: machines.length,
    activeSensors: (machines as { active: boolean }[]).filter((m) => m.active).length,
    recentLogsCount: logs.length,
    lastLogDate: logs.length > 0 ? (logs[0] as { log_date: string }).log_date : null,
    machineTypes: Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      ...stats,
    })),
  }
}

export async function getSatelliteMetrics(deptId: string): Promise<SatelliteMetrics> {
  await assertSatelliteRole()
  return _getCachedSatelliteMetrics(deptId)
}
