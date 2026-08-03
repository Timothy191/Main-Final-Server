'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

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
  return assertDeptRole(['admin', 'safety', 'supervisor'], 'safety')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedSafetyMetrics(deptId: string): Promise<SafetyMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.SAFETY,
    DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_INCIDENTS,
    `dept:safety:${deptId}`
  )

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

/* ------------------------------------------------------------------ */
/*  3. Safety Mutations                                                */
/* ------------------------------------------------------------------ */

export async function reportSafetyIncident(input: {
  departmentId: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  location?: string
  incidentDate?: string
  shiftType?: 'day' | 'night'
  injuredParties?: number
}) {
  const { revalidateTag } = await import('next/cache')
  const { reportSafetyIncidentSchema } = await import('@repo/contract')
  const validated = reportSafetyIncidentSchema.parse(input)

  const { supabase } = await assertSafetyRole()

  const incidentDate = validated.incidentDate || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('safety_incidents')
    .insert({
      department_id: validated.departmentId,
      description: `${validated.title}: ${validated.description}`,
      incident_type: validated.severity === 'critical' ? 'lost-time' : 'near-miss',
      status: 'open',
      location: validated.location || null,
      incident_date: incidentDate,
      shift_type: validated.shiftType || 'day',
      injured_parties: validated.injuredParties || 0,
    })
    .select('id')
    .single()

  if (error) {
    throw new DatabaseError('Failed to report safety incident', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.SAFETY, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_INCIDENTS, 'max')
  revalidateTag(`dept:safety:${validated.departmentId}`, 'max')

  return { success: true, incidentId: data?.id }
}

export async function updateIncidentStatus(input: {
  incidentId: string
  status: 'open' | 'under-investigation' | 'resolved' | 'closed'
  comment?: string
}) {
  const { revalidateTag } = await import('next/cache')
  const { updateIncidentStatusSchema } = await import('@repo/contract')
  const validated = updateIncidentStatusSchema.parse(input)

  const { supabase } = await assertSafetyRole()

  const updatePayload: Record<string, unknown> = {
    status: validated.status,
  }

  if (validated.status === 'resolved' || validated.status === 'closed') {
    updatePayload.closed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('safety_incidents')
    .update(updatePayload)
    .eq('id', validated.incidentId)

  if (error) {
    throw new DatabaseError('Failed to update incident status', {
      operation: 'update',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.SAFETY, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_INCIDENTS, 'max')

  return { success: true }
}
