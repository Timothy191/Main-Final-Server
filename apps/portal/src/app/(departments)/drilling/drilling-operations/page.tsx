import { createServerSupabaseClient } from '@repo/supabase/server'
import { redirect } from 'next/navigation'
import { DrillingOperationsTable } from './DrillingOperationsTable'
import { getOperationalToday } from '@repo/utils'

async function getDrillingOpsData() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dept } = await supabase
    .from('departments')
    .select('id')
    .eq('name', 'drilling')
    .single()
  if (!dept) {
    return { drills: [], ops: [], operators: [], deptId: '' }
  }

  const today = getOperationalToday()

  const [{ data: drills }, { data: ops }, { data: operators }] = await Promise.all([
    supabase
      .from('machines')
      .select('id, name')
      .eq('machine_type', 'Drill Rig')
      .eq('active', true)
      .order('name'),
    supabase
      .from('drill_operations')
      .select(
        'id, machine_id, shift_type, operation_date, open_hours, close_hours, total_hours, operator_name, block_drilled, site, external_delays_minutes, standard_delays_hours, production_delays_minutes, engineering_delays_minutes, comments, status'
      )
      .eq('department_id', dept.id)
      .eq('operation_date', today),
    supabase
      .from('employees')
      .select('id, full_name')
      .eq('department_id', dept.id)
      .order('full_name'),
  ])

  return {
    drills: drills ?? [],
    ops: ops ?? [],
    operators: operators ?? [],
    deptId: dept.id,
  }
}

export default async function DrillingOperationsPage() {
  const { drills, ops, operators, deptId } = await getDrillingOpsData()

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Drilling Operations</h2>
        <p className="text-sm text-arch-text-muted mt-1">
          Inline log per drill rig, per shift. Edits save on blur.
        </p>
      </header>

      <DrillingOperationsTable
        departmentId={deptId}
        drills={drills}
        operators={operators}
        initialOps={ops}
      />
    </div>
  )
}
