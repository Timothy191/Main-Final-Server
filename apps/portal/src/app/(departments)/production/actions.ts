'use server'

import { cacheTag } from 'next/cache'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProductionMetrics {
  coalTonnesToday: number
  wasteTonnesToday: number
  activeMachines: number
  totalMachines: number
  dailyLogsToday: number
  stripRatio: number
}

export interface RecentProductionLog {
  id: string
  logDate: string
  shift: 'day' | 'night'
  coalTonnes: number
  wasteTonnes: number
  notes: string | null
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertProductionRole() {
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

  if (!employee || !['admin', 'production', 'supervisor'].includes(employee.role)) {
    throw new ForbiddenError('Forbidden: production or admin role required', {
      resource: 'production',
      action: 'assert_role',
    })
  }

  return { supabase, user, employee }
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedProductionMetrics(deptId: string): Promise<ProductionMetrics> {
  'use cache'
  cacheTag(
    `dept:${deptId}`,
    'table:production_logs',
    'table:daily_logs',
    'table:machines',
    'department-production'
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: todayLogs, error: logsError },
    { count: activeMachines, error: machinesError },
    { count: totalMachines },
  ] = await Promise.all([
    supabase
      .from('daily_logs')
      .select(
        `
        id,
        shift,
        notes,
        production_logs (coal_tonnes, waste_tonnes)
      `
      )
      .eq('department_id', deptId)
      .eq('log_date', today),
    supabase
      .from('machines')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('active', true),
    supabase
      .from('machines')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
  ])

  if (logsError) {
    throw new DatabaseError('Failed to load production metrics', {
      operation: 'select',
      context: { error: logsError.message },
    })
  }
  if (machinesError) {
    throw new DatabaseError('Failed to load machine counts', {
      operation: 'select',
      context: { error: machinesError.message },
    })
  }

  type RawLog = {
    id: string
    shift: string
    notes: string | null
    production_logs: { coal_tonnes: number; waste_tonnes: number }[]
  }

  const logs = (todayLogs ?? []) as RawLog[]
  let coalTonnesToday = 0
  let wasteTonnesToday = 0
  for (const log of logs) {
    for (const pl of log.production_logs ?? []) {
      coalTonnesToday += Number(pl.coal_tonnes) || 0
      wasteTonnesToday += Number(pl.waste_tonnes) || 0
    }
  }

  const stripRatio =
    coalTonnesToday > 0 ? Math.round((wasteTonnesToday / coalTonnesToday) * 100) / 100 : 0

  return {
    coalTonnesToday,
    wasteTonnesToday,
    activeMachines: activeMachines ?? 0,
    totalMachines: totalMachines ?? 0,
    dailyLogsToday: logs.length,
    stripRatio,
  }
}

export async function getProductionMetrics(deptId: string): Promise<ProductionMetrics> {
  await assertProductionRole()
  return _getCachedProductionMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Recent Production Logs (not cached — dynamic activity feed)    */
/* ------------------------------------------------------------------ */

export async function getRecentProductionLogs(
  deptId: string,
  limit = 8
): Promise<RecentProductionLog[]> {
  const { supabase } = await assertProductionRole()

  const { data, error } = await supabase
    .from('daily_logs')
    .select(
      `
      id,
      log_date,
      shift,
      notes,
      production_logs (coal_tonnes, waste_tonnes)
    `
    )
    .eq('department_id', deptId)
    .order('log_date', { ascending: false })
    .order('shift', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load recent production logs', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  type RawLog = {
    id: string
    log_date: string
    shift: 'day' | 'night'
    notes: string | null
    production_logs: { coal_tonnes: number; waste_tonnes: number }[]
  }

  return ((data ?? []) as RawLog[]).map((log) => {
    const coalTonnes = (log.production_logs ?? []).reduce(
      (sum, pl) => sum + (Number(pl.coal_tonnes) || 0),
      0
    )
    const wasteTonnes = (log.production_logs ?? []).reduce(
      (sum, pl) => sum + (Number(pl.waste_tonnes) || 0),
      0
    )
    return {
      id: log.id,
      logDate: log.log_date,
      shift: log.shift,
      coalTonnes,
      wasteTonnes,
      notes: log.notes,
    }
  })
}
