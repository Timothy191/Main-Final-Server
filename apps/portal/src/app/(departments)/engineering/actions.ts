'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EngineeringMetrics {
  activeBreakdowns: number
  resolvedToday: number
  totalTires: number
  tireServiceDue: number
  tireCritical: number
}

export interface RecentBreakdown {
  id: string
  machineName: string
  machineType: string
  reason: string
  priority: string | null
  createdAt: string
}

export interface TireRecord {
  id: string
  machineName: string | null
  position: string | null
  size: string | null
  treadDepthMm: number | null
  pressurePsi: number | null
  status: 'active' | 'service-due' | 'critical' | 'replaced' | 'decommissioned'
  installedAt: string | null
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertEngineeringRole() {
  return assertDeptRole(['admin', 'engineering', 'supervisor'], 'engineering')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedEngineeringMetrics(deptId: string): Promise<EngineeringMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.ENGINEERING,
    DEPARTMENT_CACHE_TAGS.TABLE_BREAKDOWNS,
    DEPARTMENT_CACHE_TAGS.TABLE_TIRES,
    `dept:engineering:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const yesterday = new Date(Date.now() - 86400000).toISOString()

  const [
    { count: activeBreakdowns },
    { count: resolvedToday },
    { count: totalTires },
    { count: tireServiceDue },
    { count: tireCritical },
  ] = await Promise.all([
    supabase
      .from('breakdowns')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('breakdowns')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'completed')
      .gte('updated_at', yesterday),
    supabase
      .from('tires')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['active', 'service-due', 'critical']),
    supabase
      .from('tires')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'service-due'),
    supabase
      .from('tires')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'critical'),
  ])

  return {
    activeBreakdowns: activeBreakdowns ?? 0,
    resolvedToday: resolvedToday ?? 0,
    totalTires: totalTires ?? 0,
    tireServiceDue: tireServiceDue ?? 0,
    tireCritical: tireCritical ?? 0,
  }
}

export async function getEngineeringMetrics(deptId: string): Promise<EngineeringMetrics> {
  await assertEngineeringRole()
  return _getCachedEngineeringMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Recent Breakdowns (not cached — live fault board)               */
/* ------------------------------------------------------------------ */

export async function getRecentBreakdowns(deptId: string, limit = 5): Promise<RecentBreakdown[]> {
  const { supabase } = await assertEngineeringRole()

  const { data, error } = await supabase
    .from('breakdowns')
    .select('id, machine_name, machine_type, reason, priority, created_at')
    .eq('department_id', deptId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load recent breakdowns', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      machine_name: string | null
      machine_type: string | null
      reason: string | null
      priority: string | null
      created_at: string
    }[]
  ).map((row) => ({
    id: row.id,
    machineName: row.machine_name ?? row.machine_type ?? 'Unknown Machine',
    machineType: row.machine_type ?? 'Unknown',
    reason: row.reason ?? '',
    priority: row.priority,
    createdAt: row.created_at,
  }))
}

/* ------------------------------------------------------------------ */
/*  3. Tire Management                                                 */
/* ------------------------------------------------------------------ */

export async function getTires(deptId: string, limit = 100): Promise<TireRecord[]> {
  const { supabase } = await assertEngineeringRole()

  const { data, error } = await supabase
    .from('tires')
    .select('id, machine_name, position, size, tread_depth_mm, pressure_psi, status, installed_at')
    .eq('department_id', deptId)
    .in('status', ['active', 'service-due', 'critical'])
    .order('status', { ascending: true })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load tire records', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      machine_name: string | null
      position: string | null
      size: string | null
      tread_depth_mm: number | null
      pressure_psi: number | null
      status: TireRecord['status']
      installed_at: string | null
    }[]
  ).map((row) => ({
    id: row.id,
    machineName: row.machine_name,
    position: row.position,
    size: row.size,
    treadDepthMm: row.tread_depth_mm,
    pressurePsi: row.pressure_psi,
    status: row.status,
    installedAt: row.installed_at,
  }))
}
