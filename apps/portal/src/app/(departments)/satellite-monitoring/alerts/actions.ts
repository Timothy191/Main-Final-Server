'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export interface SatelliteAlertMetrics {
  total: number
  unreviewed: number
  warnings: number
  critical: number
  deformation: number
  subsidence: number
}

export interface SatelliteAlert {
  id: string
  alertType: string
  source: string
  detectedAt: string
  confidencePct: number
  description: string | null
  severity: string
  reviewed: boolean
}

async function assertSatelliteRole() {
  return assertDeptRole(['admin', 'satellite', 'supervisor'], 'satellite-monitoring')
}

async function _getCachedSatelliteAlertMetrics(deptId: string): Promise<SatelliteAlertMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.SATELLITE_MONITORING,
    DEPARTMENT_CACHE_TAGS.TABLE_SATELLITE_ALERTS,
    `dept:satellite-monitoring:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: total },
    { count: unreviewed },
    { count: warnings },
    { count: critical },
    { count: deformation },
    { count: subsidence },
  ] = await Promise.all([
    supabase
      .from('satellite_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('satellite_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('reviewed', false),
    supabase
      .from('satellite_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('severity', 'warning'),
    supabase
      .from('satellite_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('severity', 'critical'),
    supabase
      .from('satellite_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('alert_type', 'deformation'),
    supabase
      .from('satellite_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('alert_type', 'subsidence'),
  ])

  return {
    total: total ?? 0,
    unreviewed: unreviewed ?? 0,
    warnings: warnings ?? 0,
    critical: critical ?? 0,
    deformation: deformation ?? 0,
    subsidence: subsidence ?? 0,
  }
}

export async function getSatelliteAlertMetrics(deptId: string): Promise<SatelliteAlertMetrics> {
  await assertSatelliteRole()
  return _getCachedSatelliteAlertMetrics(deptId)
}

export async function getSatelliteAlerts(deptId: string, limit = 100): Promise<SatelliteAlert[]> {
  const { supabase } = await assertSatelliteRole()

  const { data, error } = await supabase
    .from('satellite_alerts')
    .select('id, alert_type, source, detected_at, confidence_pct, description, severity, reviewed')
    .eq('department_id', deptId)
    .order('detected_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load satellite alerts', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      alert_type: string
      source: string
      detected_at: string
      confidence_pct: number
      description: string | null
      severity: string
      reviewed: boolean
    }[]
  ).map((row) => ({
    id: row.id,
    alertType: row.alert_type,
    source: row.source,
    detectedAt: row.detected_at,
    confidencePct: row.confidence_pct,
    description: row.description,
    severity: row.severity,
    reviewed: row.reviewed,
  }))
}
