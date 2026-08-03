'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export interface SafetyObservationsMetrics {
  total: number
  openCount: number
  closedCount: number
  highCriticalCount: number
  safeActs: number
  hazardReports: number
}

export interface SafetyObservation {
  id: string
  observationDate: string
  observationType: string
  description: string
  location: string | null
  riskLevel: string
  status: string
}

async function assertSafetyRole() {
  return assertDeptRole(['admin', 'safety', 'supervisor'], 'safety')
}

async function _getCachedSafetyObservationsMetrics(
  deptId: string
): Promise<SafetyObservationsMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.SAFETY,
    DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_OBSERVATIONS,
    `dept:safety:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: total },
    { count: openCount },
    { count: closedCount },
    { count: highCriticalCount },
    { count: safeActs },
    { count: hazardReports },
  ] = await Promise.all([
    supabase
      .from('safety_observations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('safety_observations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['open', 'in-progress']),
    supabase
      .from('safety_observations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['closed', 'closed-verified']),
    supabase
      .from('safety_observations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('risk_level', ['high', 'critical']),
    supabase
      .from('safety_observations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('observation_type', 'safe-act'),
    supabase
      .from('safety_observations')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('observation_type', 'hazard-report'),
  ])

  return {
    total: total ?? 0,
    openCount: openCount ?? 0,
    closedCount: closedCount ?? 0,
    highCriticalCount: highCriticalCount ?? 0,
    safeActs: safeActs ?? 0,
    hazardReports: hazardReports ?? 0,
  }
}

export async function getSafetyObservationsMetrics(
  deptId: string
): Promise<SafetyObservationsMetrics> {
  await assertSafetyRole()
  return _getCachedSafetyObservationsMetrics(deptId)
}

export async function getSafetyObservations(
  deptId: string,
  limit = 100
): Promise<SafetyObservation[]> {
  const { supabase } = await assertSafetyRole()

  const { data, error } = await supabase
    .from('safety_observations')
    .select('id, observation_date, observation_type, description, location, risk_level, status')
    .eq('department_id', deptId)
    .order('observation_date', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load safety observations', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      observation_date: string
      observation_type: string
      description: string
      location: string | null
      risk_level: string
      status: string
    }[]
  ).map((row) => ({
    id: row.id,
    observationDate: row.observation_date,
    observationType: row.observation_type,
    description: row.description,
    location: row.location,
    riskLevel: row.risk_level,
    status: row.status,
  }))
}
