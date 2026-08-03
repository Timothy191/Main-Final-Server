'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

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
  return assertDeptRole(['admin', 'production', 'supervisor'], 'production')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedProductionMetrics(deptId: string): Promise<ProductionMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.PRODUCTION,
    DEPARTMENT_CACHE_TAGS.TABLE_MACHINES,
    DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS,
    `dept:production:${deptId}`
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
      .select('id, shift, notes')
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

  type RawLog = { id: string; shift: string; notes: string | null }
  const logs = (todayLogs ?? []) as RawLog[]

  let coalTonnesToday = 0
  let wasteTonnesToday = 0

  if (logs.length > 0) {
    const logIds = logs.map((l) => l.id)
    const { data: prodLogs, error: prodError } = await supabase
      .from('production_logs')
      .select('daily_log_id, coal_tonnes, waste_tonnes')
      .in('daily_log_id', logIds)

    if (prodError) {
      throw new DatabaseError('Failed to load production metrics', {
        operation: 'select',
        context: { error: prodError.message },
      })
    }

    for (const pl of prodLogs ?? []) {
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
    .select('id, log_date, shift, notes')
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

  type RawLog = { id: string; log_date: string; shift: 'day' | 'night'; notes: string | null }
  const logs = (data ?? []) as RawLog[]

  if (logs.length === 0) return []

  const logIds = logs.map((l) => l.id)
  const { data: prodLogs, error: prodError } = await supabase
    .from('production_logs')
    .select('daily_log_id, coal_tonnes, waste_tonnes')
    .in('daily_log_id', logIds)

  if (prodError) {
    throw new DatabaseError('Failed to load recent production logs', {
      operation: 'select',
      context: { error: prodError.message },
    })
  }

  const prodByLogId = new Map<string, { coal_tonnes: number; waste_tonnes: number }[]>()
  for (const pl of prodLogs ?? []) {
    const arr = prodByLogId.get(pl.daily_log_id) ?? []
    arr.push({ coal_tonnes: pl.coal_tonnes, waste_tonnes: pl.waste_tonnes })
    prodByLogId.set(pl.daily_log_id, arr)
  }

  return logs.map((log) => {
    const entries = prodByLogId.get(log.id) ?? []
    const coalTonnes = entries.reduce((sum, pl) => sum + (Number(pl.coal_tonnes) || 0), 0)
    const wasteTonnes = entries.reduce((sum, pl) => sum + (Number(pl.waste_tonnes) || 0), 0)
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

/* ------------------------------------------------------------------ */
/*  3. Production Mutations                                            */
/* ------------------------------------------------------------------ */

export async function startShift(input: {
  departmentId: string
  shiftType: 'day' | 'night'
  supervisorId: string
}) {
  const { revalidateTag } = await import('next/cache')
  const { startShiftSchema } = await import('@repo/contract')
  const validated = startShiftSchema.parse(input)

  const { supabase } = await assertProductionRole()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_logs')
    .insert({
      department_id: validated.departmentId,
      log_date: today,
      shift: validated.shiftType,
      notes: `Shift started by supervisor ${validated.supervisorId}`,
    })
    .select('id')
    .single()

  if (error) {
    throw new DatabaseError('Failed to start production shift', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.PRODUCTION, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS, 'max')
  revalidateTag(`dept:production:${validated.departmentId}`, 'max')

  return { success: true, shiftId: data?.id }
}

export async function logProductionEntry(input: {
  shiftId: string
  tonnage: number
  materialType: string
}) {
  const { revalidateTag } = await import('next/cache')
  const { logProductionEntrySchema } = await import('@repo/contract')
  const validated = logProductionEntrySchema.parse(input)

  const { supabase } = await assertProductionRole()

  const isCoal = validated.materialType.toLowerCase().includes('coal')

  const { error } = await supabase.from('production_logs').insert({
    daily_log_id: validated.shiftId,
    coal_tonnes: isCoal ? validated.tonnage : 0,
    waste_tonnes: isCoal ? 0 : validated.tonnage,
  })

  if (error) {
    throw new DatabaseError('Failed to log production entry', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.PRODUCTION, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS, 'max')

  return { success: true }
}

export async function recordDelay(input: {
  shiftId: string
  reasonCode: string
  durationMinutes: number
  notes?: string
}) {
  const { revalidateTag } = await import('next/cache')
  const { recordDelaySchema } = await import('@repo/contract')
  const validated = recordDelaySchema.parse(input)

  const { supabase } = await assertProductionRole()

  const { error } = await supabase.from('operational_delays').insert({
    daily_log_id: validated.shiftId,
    reason: `${validated.reasonCode}: ${validated.notes || 'No description'}`,
    delay_minutes: validated.durationMinutes,
  })

  if (error) {
    throw new DatabaseError('Failed to record delay', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.PRODUCTION, 'max')

  return { success: true }
}
