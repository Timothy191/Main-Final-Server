'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export interface MaintenanceMetrics {
  total: number
  scheduled: number
  inProgress: number
  completed: number
  overdue: number
}

export interface MaintenanceJob {
  id: string
  fleetCode: string | null
  vehicleType: string | null
  serviceType: string
  description: string
  scheduledDate: string
  completedDate: string | null
  status: string
  estimatedHours: number | null
  actualHours: number | null
}

async function assertLogisticsFleetRole() {
  return assertDeptRole(['admin', 'logistics', 'supervisor'], 'logistics-fleet')
}

async function _getCachedMaintenanceMetrics(deptId: string): Promise<MaintenanceMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.LOGISTICS_FLEET,
    DEPARTMENT_CACHE_TAGS.TABLE_FLEET_MAINT,
    `dept:logistics-fleet:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: total },
    { count: scheduled },
    { count: inProgress },
    { count: completed },
    { count: overdue },
  ] = await Promise.all([
    supabase
      .from('fleet_maintenance_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('fleet_maintenance_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'scheduled'),
    supabase
      .from('fleet_maintenance_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'in-progress'),
    supabase
      .from('fleet_maintenance_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'completed'),
    supabase
      .from('fleet_maintenance_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'overdue'),
  ])

  return {
    total: total ?? 0,
    scheduled: scheduled ?? 0,
    inProgress: inProgress ?? 0,
    completed: completed ?? 0,
    overdue: overdue ?? 0,
  }
}

export async function getMaintenanceMetrics(deptId: string): Promise<MaintenanceMetrics> {
  await assertLogisticsFleetRole()
  return _getCachedMaintenanceMetrics(deptId)
}

export async function getMaintenanceJobs(deptId: string, limit = 100): Promise<MaintenanceJob[]> {
  const { supabase } = await assertLogisticsFleetRole()

  const { data, error } = await supabase
    .from('fleet_maintenance_schedule')
    .select(
      'id, service_type, description, scheduled_date, completed_date, status, estimated_hours, actual_hours, fleet_id'
    )
    .eq('department_id', deptId)
    .order('scheduled_date', { ascending: true })
    .limit(limit)

  if (error)
    throw new DatabaseError('Failed to load maintenance jobs', {
      operation: 'select',
      context: { error: error.message },
    })

  const rows = (data ?? []) as {
    id: string
    service_type: string
    description: string
    scheduled_date: string
    completed_date: string | null
    status: string
    estimated_hours: number | null
    actual_hours: number | null
    fleet_id: string | null
  }[]

  let fleetData = new Map<string, { fleet_code: string; vehicle_type: string }>()
  if (rows.some((r) => r.fleet_id)) {
    const fleetIds = [...new Set(rows.map((r) => r.fleet_id).filter(Boolean))] as string[]
    const { data: fleet } = await supabase
      .from('fleet')
      .select('id, fleet_code, vehicle_type')
      .in('id', fleetIds)
    fleetData = new Map(
      (fleet ?? []).map((f) => [f.id, { fleet_code: f.fleet_code, vehicle_type: f.vehicle_type }])
    )
  }

  return rows.map((row) => {
    const fd = row.fleet_id ? fleetData.get(row.fleet_id) : undefined
    return {
      id: row.id,
      fleetCode: fd?.fleet_code ?? null,
      vehicleType: fd?.vehicle_type ?? null,
      serviceType: row.service_type,
      description: row.description,
      scheduledDate: row.scheduled_date,
      completedDate: row.completed_date,
      status: row.status,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
    }
  })
}
