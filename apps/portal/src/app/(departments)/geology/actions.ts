'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SurveyType = 'topographic' | 'grade' | 'peg-out' | 'volume' | 'monitoring'

export interface GeologyMetrics {
  totalSurveys: number
  topographicCount: number
  gradeCount: number
  volumeCount: number
  pegOutCount: number
  totalBlocks: number
  activeBlocks: number
}

export interface SurveyMeasurement {
  id: string
  surveyDate: string
  surveyType: SurveyType
  blockName: string | null
  location: string | null
  measurementValue: number | null
  unit: string | null
  notes: string | null
}

export interface MineBlock {
  id: string
  name: string
  code: string
  siteName: string | null
  active: boolean
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertGeologyRole() {
  return assertDeptRole(['admin', 'geology', 'supervisor'], 'geology')
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedGeologyMetrics(deptId: string): Promise<GeologyMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.GEOLOGY,
    DEPARTMENT_CACHE_TAGS.TABLE_SURVEY_MEASUREMENTS,
    `dept:geology:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: totalSurveys },
    { count: topographicCount },
    { count: gradeCount },
    { count: volumeCount },
    { count: pegOutCount },
    { count: totalBlocks },
  ] = await Promise.all([
    supabase
      .from('survey_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('survey_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('survey_type', 'topographic'),
    supabase
      .from('survey_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('survey_type', 'grade'),
    supabase
      .from('survey_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('survey_type', 'volume'),
    supabase
      .from('survey_measurements')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('survey_type', 'peg-out'),
    supabase.from('mine_blocks').select('id', { count: 'exact', head: true }),
  ])

  return {
    totalSurveys: totalSurveys ?? 0,
    topographicCount: topographicCount ?? 0,
    gradeCount: gradeCount ?? 0,
    volumeCount: volumeCount ?? 0,
    pegOutCount: pegOutCount ?? 0,
    totalBlocks: totalBlocks ?? 0,
    activeBlocks: totalBlocks ?? 0,
  }
}

export async function getGeologyMetrics(deptId: string): Promise<GeologyMetrics> {
  await assertGeologyRole()
  return _getCachedGeologyMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Survey measurements (not cached — dynamic field data)           */
/* ------------------------------------------------------------------ */

export async function getSurveyMeasurements(
  deptId: string,
  filters?: { type?: string },
  limit = 100
): Promise<SurveyMeasurement[]> {
  const { supabase } = await assertGeologyRole()

  let query = supabase
    .from('survey_measurements')
    .select('id, survey_date, survey_type, location, measurement_value, unit, notes, block_id')
    .eq('department_id', deptId)
    .order('survey_date', { ascending: false })
    .limit(limit)

  if (filters?.type && filters.type !== 'All') {
    query = query.eq('survey_type', filters.type)
  }

  const { data, error } = await query

  if (error) {
    throw new DatabaseError('Failed to load survey measurements', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  const rows = (data ?? []) as {
    id: string
    survey_date: string
    survey_type: SurveyType
    location: string | null
    measurement_value: number | null
    unit: string | null
    notes: string | null
    block_id: string | null
  }[]

  let blockNames = new Map<string, string>()
  if (rows.some((r) => r.block_id)) {
    const blockIds = [...new Set(rows.map((r) => r.block_id).filter(Boolean))] as string[]
    const { data: blocks } = await supabase
      .from('mine_blocks')
      .select('id, name')
      .in('id', blockIds)
    blockNames = new Map((blocks ?? []).map((b) => [b.id, b.name]))
  }

  return rows.map((row) => ({
    id: row.id,
    surveyDate: row.survey_date,
    surveyType: row.survey_type,
    blockName: row.block_id ? (blockNames.get(row.block_id) ?? null) : null,
    location: row.location,
    measurementValue: row.measurement_value,
    unit: row.unit,
    notes: row.notes,
  }))
}

export async function getRecentSurveys(deptId: string, limit = 6): Promise<SurveyMeasurement[]> {
  return getSurveyMeasurements(deptId, undefined, limit)
}

/* ------------------------------------------------------------------ */
/*  3. Mine blocks (reference data)                                    */
/* ------------------------------------------------------------------ */

export async function getMineBlocks(): Promise<MineBlock[]> {
  await assertGeologyRole()

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('mine_blocks')
    .select('id, name, code, active, site_id')
    .order('name', { ascending: true })

  if (error) {
    throw new DatabaseError('Failed to load mine blocks', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  const rows = (data ?? []) as {
    id: string
    name: string
    code: string
    active: boolean
    site_id: string | null
  }[]

  let siteNames = new Map<string, string>()
  if (rows.some((r) => r.site_id)) {
    const siteIds = [...new Set(rows.map((r) => r.site_id).filter(Boolean))] as string[]
    const { data: sites } = await supabase.from('sites').select('id, name').in('id', siteIds)
    siteNames = new Map((sites ?? []).map((s) => [s.id, s.name]))
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    siteName: row.site_id ? (siteNames.get(row.site_id) ?? null) : null,
    active: row.active,
  }))
}
