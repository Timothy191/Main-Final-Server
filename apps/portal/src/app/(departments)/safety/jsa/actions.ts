'use server'

import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'

export interface JSAMetrics {
  total: number
  draft: number
  reviewed: number
  approved: number
  highRisk: number
}

export interface JSARecord {
  id: string
  jsaNumber: string
  jobDescription: string
  location: string | null
  hazardsIdentified: number
  riskLevel: string
  status: string
  validFrom: string
  validTo: string | null
}

async function assertSafetyRole() {
  return assertDeptRole(['admin', 'safety', 'supervisor'], 'safety')
}

export async function getJSAMetrics(deptId: string): Promise<JSAMetrics> {
  const { supabase } = await assertSafetyRole()

  const [
    { count: total },
    { count: draft },
    { count: reviewed },
    { count: approved },
    { count: highRisk },
  ] = await Promise.all([
    supabase
      .from('job_safety_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('job_safety_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'draft'),
    supabase
      .from('job_safety_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'reviewed'),
    supabase
      .from('job_safety_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'approved'),
    supabase
      .from('job_safety_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .in('risk_level', ['high', 'critical']),
  ])

  return {
    total: total ?? 0,
    draft: draft ?? 0,
    reviewed: reviewed ?? 0,
    approved: approved ?? 0,
    highRisk: highRisk ?? 0,
  }
}

export async function getJSAs(deptId: string, limit = 100): Promise<JSARecord[]> {
  const { supabase } = await assertSafetyRole()

  const { data, error } = await supabase
    .from('job_safety_analyses')
    .select(
      'id, jsa_number, job_description, location, hazards_identified, risk_level, status, valid_from, valid_to'
    )
    .eq('department_id', deptId)
    .order('valid_from', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load JSAs', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      jsa_number: string
      job_description: string
      location: string | null
      hazards_identified: number
      risk_level: string
      status: string
      valid_from: string
      valid_to: string | null
    }[]
  ).map((row) => ({
    id: row.id,
    jsaNumber: row.jsa_number,
    jobDescription: row.job_description,
    location: row.location,
    hazardsIdentified: row.hazards_identified,
    riskLevel: row.risk_level,
    status: row.status,
    validFrom: row.valid_from,
    validTo: row.valid_to,
  }))
}
