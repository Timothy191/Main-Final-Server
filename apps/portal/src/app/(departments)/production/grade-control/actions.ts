'use server'

import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'

export interface GradeControlMetrics {
  total: number
  pending: number
  inLab: number
  resultsReceived: number
  reviewed: number
  avgAsh: number
  avgCalorific: number
}

export interface GradeSample {
  id: string
  sampleDate: string
  sampleType: string
  blockName: string | null
  location: string | null
  ashPct: number | null
  sulphurPct: number | null
  calorificValue: number | null
  moisturePct: number | null
  status: string
}

async function assertProductionRole() {
  return assertDeptRole(['admin', 'production', 'supervisor'], 'production')
}

export async function getGradeControlMetrics(deptId: string): Promise<GradeControlMetrics> {
  const { supabase } = await assertProductionRole()

  const [
    { count: total },
    { count: pending },
    { count: inLab },
    { count: resultsReceived },
    { count: reviewed },
    { data: samples },
  ] = await Promise.all([
    supabase
      .from('grade_control_samples')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('grade_control_samples')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'pending'),
    supabase
      .from('grade_control_samples')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'in-lab'),
    supabase
      .from('grade_control_samples')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'results-received'),
    supabase
      .from('grade_control_samples')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'reviewed'),
    supabase
      .from('grade_control_samples')
      .select('ash_pct, calorific_value')
      .eq('department_id', deptId),
  ])

  const rows = (samples ?? []) as { ash_pct: number | null; calorific_value: number | null }[]
  const ashValues = rows.map((r) => r.ash_pct).filter((v): v is number => v !== null)
  const calValues = rows.map((r) => r.calorific_value).filter((v): v is number => v !== null)

  return {
    total: total ?? 0,
    pending: pending ?? 0,
    inLab: inLab ?? 0,
    resultsReceived: resultsReceived ?? 0,
    reviewed: reviewed ?? 0,
    avgAsh:
      ashValues.length > 0
        ? Math.round((ashValues.reduce((a, b) => a + b, 0) / ashValues.length) * 10) / 10
        : 0,
    avgCalorific:
      calValues.length > 0
        ? Math.round(calValues.reduce((a, b) => a + b, 0) / calValues.length)
        : 0,
  }
}

export async function getGradeSamples(deptId: string, limit = 100): Promise<GradeSample[]> {
  const { supabase } = await assertProductionRole()

  const { data, error } = await supabase
    .from('grade_control_samples')
    .select(
      'id, sample_date, sample_type, ash_pct, sulphur_pct, calorific_value, moisture_pct, status, block_id, location'
    )
    .eq('department_id', deptId)
    .order('sample_date', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load grade control samples', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  const rows = (data ?? []) as {
    id: string
    sample_date: string
    sample_type: string
    ash_pct: number | null
    sulphur_pct: number | null
    calorific_value: number | null
    moisture_pct: number | null
    status: string
    block_id: string | null
    location: string | null
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
    sampleDate: row.sample_date,
    sampleType: row.sample_type,
    blockName: row.block_id ? (blockNames.get(row.block_id) ?? null) : null,
    location: row.location,
    ashPct: row.ash_pct,
    sulphurPct: row.sulphur_pct,
    calorificValue: row.calorific_value,
    moisturePct: row.moisture_pct,
    status: row.status,
  }))
}
