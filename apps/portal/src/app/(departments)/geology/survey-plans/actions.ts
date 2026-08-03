'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export interface SurveyPlanMetrics {
  total: number
  planned: number
  inProgress: number
  completed: number
}

export interface SurveyPlan {
  id: string
  planName: string
  blockName: string | null
  surveyType: string
  plannedDate: string | null
  completedDate: string | null
  areaSizeHa: number | null
  pointCount: number | null
  status: string
}

async function assertGeologyRole() {
  return assertDeptRole(['admin', 'geology', 'supervisor'], 'geology')
}

async function _getCachedSurveyPlanMetrics(deptId: string): Promise<SurveyPlanMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.GEOLOGY,
    DEPARTMENT_CACHE_TAGS.TABLE_SURVEY_PLANS,
    `dept:geology:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [{ count: total }, { count: planned }, { count: inProgress }, { count: completed }] =
    await Promise.all([
      supabase
        .from('survey_plans')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', deptId),
      supabase
        .from('survey_plans')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', deptId)
        .eq('status', 'planned'),
      supabase
        .from('survey_plans')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', deptId)
        .eq('status', 'in-progress'),
      supabase
        .from('survey_plans')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', deptId)
        .eq('status', 'completed'),
    ])
  return {
    total: total ?? 0,
    planned: planned ?? 0,
    inProgress: inProgress ?? 0,
    completed: completed ?? 0,
  }
}

export async function getSurveyPlanMetrics(deptId: string): Promise<SurveyPlanMetrics> {
  await assertGeologyRole()
  return _getCachedSurveyPlanMetrics(deptId)
}

export async function getSurveyPlans(deptId: string, limit = 100): Promise<SurveyPlan[]> {
  const { supabase } = await assertGeologyRole()

  const { data, error } = await supabase
    .from('survey_plans')
    .select(
      'id, plan_name, survey_type, planned_date, completed_date, area_size_ha, point_count, status, block_id'
    )
    .eq('department_id', deptId)
    .order('planned_date', { ascending: true })
    .limit(limit)

  if (error)
    throw new DatabaseError('Failed to load survey plans', {
      operation: 'select',
      context: { error: error.message },
    })

  const rows = (data ?? []) as {
    id: string
    plan_name: string
    survey_type: string
    planned_date: string | null
    completed_date: string | null
    area_size_ha: number | null
    point_count: number | null
    status: string
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
    planName: row.plan_name,
    blockName: row.block_id ? (blockNames.get(row.block_id) ?? null) : null,
    surveyType: row.survey_type,
    plannedDate: row.planned_date,
    completedDate: row.completed_date,
    areaSizeHa: row.area_size_ha,
    pointCount: row.point_count,
    status: row.status,
  }))
}
