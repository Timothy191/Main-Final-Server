'use server'

import { cacheTag } from 'next/cache'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SafetyMetrics {
  openIncidents: number
  resolvedThisMonth: number
  lostTimeIncidents: number
  nearMissCount: number
  underInvestigation: number
  incidentsTodayCount: number
}

export interface RecentSafetyIncident {
  id: string
  incidentDate: string
  shiftType: 'day' | 'night'
  incidentType: string
  status: string
  description: string
  location: string | null
  injuredParties: number
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertSafetyRole() {
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

  if (!employee || !['admin', 'safety', 'supervisor'].includes(employee.role)) {
    throw new ForbiddenError('Forbidden: safety or admin role required', {
      resource: 'safety',
      action: 'assert_role',
    })
  }

  return { supabase, user, employee }
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedSafetyMetrics(deptId: string): Promise<SafetyMetrics> {
  'use cache'
  cacheTag(`dept:${deptId}`, 'table:safety_incidents', 'department-safety', 'department-dashboard')

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const monthStart = firstOfMonth.toISOString().split('T')[0]

  const [
    { count: openIncidents },
    { count: resolvedThisMonth },
    { count: lostTimeIncidents },
    { count: nearMissCount },
    { count: underInvestigation },
    { count: incidentsTodayCount },
  ] = await Promise.all([
    supabase
      .from('safety_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'open'),
    supabase
      .from('safety_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['resolved', 'closed'])
      .gte('closed_at', monthStart),
    supabase
      .from('safety_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('incident_type', 'lost-time'),
    supabase
      .from('safety_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('incident_type', 'near-miss'),
    supabase
      .from('safety_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'under-investigation'),
    supabase
      .from('safety_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('incident_date', today),
  ])

  return {
    openIncidents: openIncidents ?? 0,
    resolvedThisMonth: resolvedThisMonth ?? 0,
    lostTimeIncidents: lostTimeIncidents ?? 0,
    nearMissCount: nearMissCount ?? 0,
    underInvestigation: underInvestigation ?? 0,
    incidentsTodayCount: incidentsTodayCount ?? 0,
  }
}

export async function getSafetyMetrics(deptId: string): Promise<SafetyMetrics> {
  await assertSafetyRole()
  return _getCachedSafetyMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Recent Incidents (not cached — dynamic activity feed)          */
/* ------------------------------------------------------------------ */

export async function getRecentSafetyIncidents(
  deptId: string,
  limit = 8
): Promise<RecentSafetyIncident[]> {
  const { supabase } = await assertSafetyRole()

  const { data, error } = await supabase
    .from('safety_incidents')
    .select(
      `
      id,
      incident_date,
      shift_type,
      incident_type,
      status,
      description,
      location,
      injured_parties
    `
    )
    .eq('department_id', deptId)
    .order('incident_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load recent safety incidents', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      incident_date: string
      shift_type: 'day' | 'night'
      incident_type: string
      status: string
      description: string
      location: string | null
      injured_parties: number
    }[]
  ).map((row) => ({
    id: row.id,
    incidentDate: row.incident_date,
    shiftType: row.shift_type,
    incidentType: row.incident_type,
    status: row.status,
    description: row.description,
    location: row.location,
    injuredParties: row.injured_parties,
  }))
}
