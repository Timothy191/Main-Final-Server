'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LogisticsMetrics {
  totalFleet: number
  activeFleet: number
  inService: number
  outOfService: number
  fuelLitresToday: number
  maintenanceDue: number
}

export interface FleetVehicle {
  id: string
  fleetCode: string
  vehicleType: string
  registrationNumber: string | null
  make: string | null
  model: string | null
  status: string
  lastServiceDate: string | null
  nextServiceDate: string | null
}

export interface FuelLogEntry {
  id: string
  logDate: string
  machineName: string | null
  dieselLitres: number
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertLogisticsFleetRole() {
  return assertDeptRole(['admin', 'logistics', 'supervisor'], 'logistics-fleet')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedLogisticsMetrics(deptId: string): Promise<LogisticsMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.LOGISTICS_FLEET,
    DEPARTMENT_CACHE_TAGS.TABLE_FLEET,
    DEPARTMENT_CACHE_TAGS.TABLE_FUEL_LOGS,
    `dept:logistics-fleet:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalFleet },
    { count: activeFleet },
    { count: inService },
    { count: outOfService },
    { data: fuelToday },
    { count: maintenanceDue },
  ] = await Promise.all([
    supabase.from('fleet').select('id', { count: 'exact', head: true }),
    supabase.from('fleet').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('fleet').select('id', { count: 'exact', head: true }).eq('status', 'In Service'),
    supabase
      .from('fleet')
      .select('id', { count: 'exact', head: true })
      .in('status', ['Inactive', 'Decommissioned']),
    supabase
      .from('fuel_logs')
      .select('diesel_litres, daily_log_id')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('fleet')
      .select('id', { count: 'exact', head: true })
      .not('next_service_date', 'is', null)
      .lte('next_service_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
  ])

  // Fuel today: join through daily_logs to filter by log_date
  const fuelRows = (fuelToday ?? []) as { diesel_litres: number | null; daily_log_id: string }[]
  let fuelLitresToday = 0
  if (fuelRows.length > 0) {
    const logIds = fuelRows.map((r) => r.daily_log_id)
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('id')
      .in('id', logIds)
      .eq('log_date', today)
    const todayLogIds = new Set((logs ?? []).map((l) => l.id))
    fuelLitresToday = fuelRows
      .filter((r) => todayLogIds.has(r.daily_log_id))
      .reduce((sum, r) => sum + (Number(r.diesel_litres) || 0), 0)
  }

  return {
    totalFleet: totalFleet ?? 0,
    activeFleet: activeFleet ?? 0,
    inService: inService ?? 0,
    outOfService: outOfService ?? 0,
    fuelLitresToday,
    maintenanceDue: maintenanceDue ?? 0,
  }
}

export async function getLogisticsMetrics(deptId: string): Promise<LogisticsMetrics> {
  await assertLogisticsFleetRole()
  return _getCachedLogisticsMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Fleet register (not cached — live)                              */
/* ------------------------------------------------------------------ */

export async function getFleetList(limit = 200): Promise<FleetVehicle[]> {
  const { supabase } = await assertLogisticsFleetRole()

  const { data, error } = await supabase
    .from('fleet')
    .select(
      'id, fleet_code, vehicle_type, registration_number, make, model, status, last_service_date, next_service_date'
    )
    .order('fleet_code', { ascending: true })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load fleet register', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      fleet_code: string
      vehicle_type: string
      registration_number: string | null
      make: string | null
      model: string | null
      status: string
      last_service_date: string | null
      next_service_date: string | null
    }[]
  ).map((row) => ({
    id: row.id,
    fleetCode: row.fleet_code,
    vehicleType: row.vehicle_type,
    registrationNumber: row.registration_number,
    make: row.make,
    model: row.model,
    status: row.status,
    lastServiceDate: row.last_service_date,
    nextServiceDate: row.next_service_date,
  }))
}

/* ------------------------------------------------------------------ */
/*  3. Fuel logs (not cached — live consumption feed)                  */
/* ------------------------------------------------------------------ */

export async function getFuelLogs(limit = 100): Promise<FuelLogEntry[]> {
  const { supabase } = await assertLogisticsFleetRole()

  const { data, error } = await supabase
    .from('fuel_logs')
    .select('id, diesel_litres, created_at, daily_log_id, machine_id')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load fuel logs', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  const rows = (data ?? []) as {
    id: string
    diesel_litres: number | null
    created_at: string
    daily_log_id: string
    machine_id: string
  }[]

  if (rows.length === 0) return []

  const logIds = rows.map((r) => r.daily_log_id)
  const machineIds = rows.map((r) => r.machine_id)

  const [{ data: logs }, { data: machines }] = await Promise.all([
    supabase.from('daily_logs').select('id, log_date').in('id', logIds),
    supabase.from('machines').select('id, name').in('id', machineIds),
  ])

  const logDateById = new Map((logs ?? []).map((l) => [l.id, l.log_date]))
  const machineNameById = new Map((machines ?? []).map((m) => [m.id, m.name]))

  return rows.map((row) => ({
    id: row.id,
    logDate: logDateById.get(row.daily_log_id) ?? row.created_at.split('T')[0],
    machineName: machineNameById.get(row.machine_id) ?? null,
    dieselLitres: Number(row.diesel_litres) || 0,
    createdAt: row.created_at,
  }))
}
