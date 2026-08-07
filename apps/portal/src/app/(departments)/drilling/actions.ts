'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DrillingMetrics {
  shiftCount: number
  latestShift: string | null
  machineCount: number
  totalHours: number
  activeOps: number
  delayCount: number
  delayMinutes: number
  metersDrilled: number
  holesDrilled: number
}

export interface RecentDrillOperation {
  id: string
  operationDate: string
  machineName: string
  operatorName: string | null
  blockDrilled: string | null
  totalHours: number | null
  metersDrilled: number | null
  holes: number | null
  status: string
}

export interface BlastMetrics {
  totalBlasts: number
  designedBlasts: number
  loadedBlasts: number
  firedBlasts: number
  reviewedBlasts: number
  cancelledBlasts: number
  totalDesignedTonnes: number
}

export interface BlastDesign {
  id: string
  blastName: string
  blockName: string | null
  designedHoles: number
  actualHoles: number | null
  designedTonnes: number | null
  actualTonnes: number | null
  explosiveType: string | null
  totalExplosiveKg: number | null
  status: string
  blastDate: string | null
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertDrillingRole() {
  return assertDeptRole(['admin', 'drilling', 'supervisor'], 'drilling')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedDrillingMetrics(deptId: string, today: string): Promise<DrillingMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.DRILLING,
    DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS,
    DEPARTMENT_CACHE_TAGS.TABLE_MACHINES,
    DEPARTMENT_CACHE_TAGS.TABLE_DRILL_OPERATIONS,
    `dept:drilling:${deptId}`,
    `dept:drilling:${deptId}:${today}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { data: todayLogs },
    { count: machineCount },
    { data: todayOperations },
    { data: todayDelays },
  ] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('id, log_date, shift')
      .eq('department_id', deptId)
      .eq('log_date', today)
      .order('shift'),
    supabase
      .from('machines')
      .select('*', { count: 'exact', head: true })
      .eq('machine_type', 'Drill Rig')
      .eq('active', true),
    supabase
      .from('drill_operations')
      .select('total_hours, status, meters_drilled, holes')
      .eq('department_id', deptId)
      .eq('operation_date', today),
    supabase
      .from('operational_delays')
      .select('delay_minutes, status')
      .eq('department_id', deptId)
      .eq('delay_date', today),
  ])

  const logs = (todayLogs ?? []) as { shift: string }[]
  const ops = (todayOperations ?? []) as {
    total_hours: number | null
    status: string
    meters_drilled: number | null
    holes: number | null
  }[]
  const delays = (todayDelays ?? []) as { delay_minutes: number | null }[]

  return {
    shiftCount: logs.length,
    latestShift: logs.length > 0 ? (logs[logs.length - 1]?.shift ?? null) : null,
    machineCount: machineCount ?? 0,
    totalHours: ops.reduce((sum, op) => sum + (Number(op.total_hours) || 0), 0),
    activeOps: ops.filter((op) => op.status === 'active').length,
    delayCount: delays.length,
    delayMinutes: delays.reduce((sum, d) => sum + (Number(d.delay_minutes) || 0), 0),
    metersDrilled: ops.reduce((sum, op) => sum + (Number(op.meters_drilled) || 0), 0),
    holesDrilled: ops.reduce((sum, op) => sum + (Number(op.holes) || 0), 0),
  }
}

export async function getDrillingMetrics(deptId: string, today: string): Promise<DrillingMetrics> {
  await assertDrillingRole()
  return _getCachedDrillingMetrics(deptId, today)
}

/* ------------------------------------------------------------------ */
/*  2. Blast Designs                                                   */
/* ------------------------------------------------------------------ */

async function _getCachedBlastMetrics(deptId: string): Promise<BlastMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.DRILLING,
    DEPARTMENT_CACHE_TAGS.TABLE_BLAST_DESIGNS,
    `dept:drilling:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: totalBlasts },
    { count: designedBlasts },
    { count: loadedBlasts },
    { count: firedBlasts },
    { count: reviewedBlasts },
    { count: cancelledBlasts },
    { data: tonnesData },
  ] = await Promise.all([
    supabase
      .from('blast_designs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('blast_designs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'designed'),
    supabase
      .from('blast_designs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'loaded'),
    supabase
      .from('blast_designs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['fired', 'mucked']),
    supabase
      .from('blast_designs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'reviewed'),
    supabase
      .from('blast_designs')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'cancelled'),
    supabase.from('blast_designs').select('designed_tonnes').eq('department_id', deptId),
  ])

  const tonnes = (tonnesData ?? []) as { designed_tonnes: number | null }[]
  const totalDesignedTonnes = tonnes.reduce((s, t) => s + (Number(t.designed_tonnes) || 0), 0)

  return {
    totalBlasts: totalBlasts ?? 0,
    designedBlasts: designedBlasts ?? 0,
    loadedBlasts: loadedBlasts ?? 0,
    firedBlasts: firedBlasts ?? 0,
    reviewedBlasts: reviewedBlasts ?? 0,
    cancelledBlasts: cancelledBlasts ?? 0,
    totalDesignedTonnes,
  }
}

export async function getBlastMetrics(deptId: string): Promise<BlastMetrics> {
  await assertDrillingRole()
  return _getCachedBlastMetrics(deptId)
}

export async function getBlastDesigns(deptId: string): Promise<BlastDesign[]> {
  await assertDrillingRole()

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('blast_designs')
    .select(
      'id, blast_name, designed_holes, actual_holes, designed_tonnes, actual_tonnes, explosive_type, total_explosive_kg, status, blast_date, block_id'
    )
    .eq('department_id', deptId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new DatabaseError('Failed to load blast designs', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  const rows = (data ?? []) as {
    id: string
    blast_name: string
    designed_holes: number
    actual_holes: number | null
    designed_tonnes: number | null
    actual_tonnes: number | null
    explosive_type: string | null
    total_explosive_kg: number | null
    status: string
    blast_date: string | null
    block_id: string | null
  }[]

  let blockNames = new Map<string, string>()
  if (rows.some((r) => r.block_id)) {
    const blockIds = [...new Set(rows.map((r) => r.block_id).filter(Boolean))] as string[]
    const { data: blocks } = await supabase
      .from('mine_blocks')
      .select('id, name')
      .in('id', blockIds)
    blockNames = new Map(
      (blocks ?? []).map((b: { id: string; name: string }) => [b.id, b.name] as [string, string])
    )
  }

  return rows.map((row) => ({
    id: row.id,
    blastName: row.blast_name,
    blockName: row.block_id ? (blockNames.get(row.block_id) ?? null) : null,
    designedHoles: row.designed_holes,
    actualHoles: row.actual_holes,
    designedTonnes: row.designed_tonnes,
    actualTonnes: row.actual_tonnes,
    explosiveType: row.explosive_type,
    totalExplosiveKg: row.total_explosive_kg,
    status: row.status,
    blastDate: row.blast_date,
  }))
}

/* ------------------------------------------------------------------ */
/*  3. Recent Drill Operations (not cached — live shift log)          */
/* ------------------------------------------------------------------ */

export async function getRecentDrillOperations(
  deptId: string,
  limit = 8
): Promise<RecentDrillOperation[]> {
  const { supabase } = await assertDrillingRole()

  const { data, error } = await supabase
    .from('drill_operations')
    .select(
      `
      id,
      operation_date,
      operator_name,
      block_drilled,
      total_hours,
      meters_drilled,
      holes,
      status,
      machines!inner(name)
    `
    )
    .eq('department_id', deptId)
    .order('operation_date', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load recent drill operations', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as unknown as {
      id: string
      operation_date: string
      operator_name: string | null
      block_drilled: string | null
      total_hours: number | null
      meters_drilled: number | null
      holes: number | null
      status: string
      machines: { name: string }
    }[]
  ).map((row) => ({
    id: row.id,
    operationDate: row.operation_date,
    machineName: row.machines.name,
    operatorName: row.operator_name,
    blockDrilled: row.block_drilled,
    totalHours: row.total_hours,
    metersDrilled: row.meters_drilled,
    holes: row.holes,
    status: row.status,
  }))
}
