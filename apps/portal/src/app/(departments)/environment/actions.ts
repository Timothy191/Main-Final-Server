'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ReadingType = 'dust' | 'water' | 'noise' | 'emissions' | 'weather'

export interface EnvironmentMetrics {
  readingsToday: number
  totalReadings: number
  exceededCount: number
  underInvestigation: number
  dustReadings: number
  waterReadings: number
  complianceRate: number
}

export interface EnvironmentalReading {
  id: string
  readingDate: string
  readingType: ReadingType
  value: number
  unit: string
  location: string | null
  status: 'within-limit' | 'exceeded' | 'under-investigation'
  notes: string | null
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertEnvironmentRole() {
  return assertDeptRole(['admin', 'environment', 'supervisor'], 'environment')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedEnvironmentMetrics(deptId: string): Promise<EnvironmentMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.ENVIRONMENT,
    DEPARTMENT_CACHE_TAGS.TABLE_ENVIRONMENTAL_READINGS,
    `dept:environment:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: readingsToday },
    { count: totalReadings },
    { count: exceededCount },
    { count: underInvestigation },
    { count: dustReadings },
    { count: waterReadings },
  ] = await Promise.all([
    supabase
      .from('environmental_readings')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('reading_date', today),
    supabase
      .from('environmental_readings')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('environmental_readings')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'exceeded'),
    supabase
      .from('environmental_readings')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'under-investigation'),
    supabase
      .from('environmental_readings')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('reading_type', 'dust'),
    supabase
      .from('environmental_readings')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('reading_type', 'water'),
  ])

  const total = totalReadings ?? 0
  const complianceRate =
    total > 0
      ? Math.round(((total - (exceededCount ?? 0) - (underInvestigation ?? 0)) / total) * 100)
      : 100

  return {
    readingsToday: readingsToday ?? 0,
    totalReadings: total,
    exceededCount: exceededCount ?? 0,
    underInvestigation: underInvestigation ?? 0,
    dustReadings: dustReadings ?? 0,
    waterReadings: waterReadings ?? 0,
    complianceRate,
  }
}

export async function getEnvironmentMetrics(deptId: string): Promise<EnvironmentMetrics> {
  await assertEnvironmentRole()
  return _getCachedEnvironmentMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Readings (not cached — live monitoring feed)                    */
/* ------------------------------------------------------------------ */

export async function getEnvironmentalReadings(
  deptId: string,
  filters?: { type?: string; status?: string },
  limit = 100
): Promise<EnvironmentalReading[]> {
  const { supabase } = await assertEnvironmentRole()

  let query = supabase
    .from('environmental_readings')
    .select('id, reading_date, reading_type, value, unit, location, status, notes')
    .eq('department_id', deptId)
    .order('reading_date', { ascending: false })
    .limit(limit)

  if (filters?.type && filters.type !== 'All') {
    query = query.eq('reading_type', filters.type)
  }
  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    throw new DatabaseError('Failed to load environmental readings', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      reading_date: string
      reading_type: ReadingType
      value: number
      unit: string
      location: string | null
      status: EnvironmentalReading['status']
      notes: string | null
    }[]
  ).map((row) => ({
    id: row.id,
    readingDate: row.reading_date,
    readingType: row.reading_type,
    value: row.value,
    unit: row.unit,
    location: row.location,
    status: row.status,
    notes: row.notes,
  }))
}

export async function getRecentReadings(
  deptId: string,
  limit = 6
): Promise<EnvironmentalReading[]> {
  return getEnvironmentalReadings(deptId, undefined, limit)
}
