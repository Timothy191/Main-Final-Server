'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export interface EnvIncidentMetrics {
  total: number
  openInvestigating: number
  resolvedClosed: number
  spillCount: number
  emissionCount: number
  regulatoryNotified: number
}

export interface EnvIncident {
  id: string
  incidentDate: string
  incidentType: string
  description: string
  location: string | null
  severity: string
  regulatoryNotified: boolean
  status: string
}

async function assertEnvironmentRole() {
  return assertDeptRole(['admin', 'environment', 'supervisor'], 'environment')
}

async function _getCachedEnvIncidentMetrics(deptId: string): Promise<EnvIncidentMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.ENVIRONMENT,
    DEPARTMENT_CACHE_TAGS.TABLE_ENV_INCIDENTS,
    `dept:environment:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: total },
    { count: openInvestigating },
    { count: resolvedClosed },
    { count: spillCount },
    { count: emissionCount },
    { count: regulatoryNotified },
  ] = await Promise.all([
    supabase
      .from('environmental_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('environmental_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['open', 'investigating']),
    supabase
      .from('environmental_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('status', ['resolved', 'closed']),
    supabase
      .from('environmental_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('incident_type', 'spill'),
    supabase
      .from('environmental_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('incident_type', 'emission-exceedance'),
    supabase
      .from('environmental_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('regulatory_notified', true),
  ])

  return {
    total: total ?? 0,
    openInvestigating: openInvestigating ?? 0,
    resolvedClosed: resolvedClosed ?? 0,
    spillCount: spillCount ?? 0,
    emissionCount: emissionCount ?? 0,
    regulatoryNotified: regulatoryNotified ?? 0,
  }
}

export async function getEnvIncidentMetrics(deptId: string): Promise<EnvIncidentMetrics> {
  await assertEnvironmentRole()
  return _getCachedEnvIncidentMetrics(deptId)
}

export async function getEnvironmentalIncidents(
  deptId: string,
  limit = 100
): Promise<EnvIncident[]> {
  const { supabase } = await assertEnvironmentRole()

  const { data, error } = await supabase
    .from('environmental_incidents')
    .select(
      'id, incident_date, incident_type, description, location, severity, regulatory_notified, status'
    )
    .eq('department_id', deptId)
    .order('incident_date', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load environmental incidents', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      incident_date: string
      incident_type: string
      description: string
      location: string | null
      severity: string
      regulatory_notified: boolean
      status: string
    }[]
  ).map((row) => ({
    id: row.id,
    incidentDate: row.incident_date,
    incidentType: row.incident_type,
    description: row.description,
    location: row.location,
    severity: row.severity,
    regulatoryNotified: row.regulatory_notified,
    status: row.status,
  }))
}
