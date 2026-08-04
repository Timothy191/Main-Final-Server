import { createServerSupabaseClient } from '@repo/supabase/server'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Shovel, Weight, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  ExcavatorActivityBuilder,
  type BuilderSite,
  type BuilderMachine,
  type BuilderActivity,
} from './ExcavatorActivityBuilder'

export const metadata: Metadata = {
  title: 'Excavator Activity | Control Room | Arch OS',
  description: 'Live excavator operations, payload tracking, and cycle times.',
}

interface OperatorRelation {
  full_name: string
}

export default async function ExcavatorActivityPage() {
  const { deptId } = await getDepartmentContext({ department: 'control-room' })
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Reference data — sites, excavator machines, prior activity, and machine hours.
  const [sitesRes, machinesRes, activitiesRes, hoursRes] = await Promise.all([
    supabase.from('sites').select('id, name').order('name'),
    supabase
      .from('machines')
      .select('id, name, machine_type, serial_number, bin_factor, site_id')
      .eq('department_id', deptId)
      .eq('active', true),
    supabase
      .from('excavator_activity')
      .select(
        `
        id,
        activity_date,
        shift_type,
        loads,
        passes,
        material_type,
        estimated_tonnes,
        machine_id,
        site_id,
        operator:employees(full_name)
      `
      )
      .eq('department_id', deptId)
      .order('activity_date', { ascending: false })
      .limit(500),
    supabase.from('machine_hours').select('machine_id, hours_worked'),
  ])

  if (sitesRes.error || machinesRes.error || activitiesRes.error || hoursRes.error) {
    throw new Error(
      `Failed to load excavator activity data: ${[
        sitesRes.error,
        machinesRes.error,
        activitiesRes.error,
        hoursRes.error,
      ]
        .map((e) => e?.message)
        .filter(Boolean)
        .join('; ')}`
    )
  }

  const sites = (sitesRes.data ?? []) as unknown as BuilderSite[]
  const machines = (machinesRes.data ?? []) as unknown as BuilderMachine[]

  // Flatten the embedded employees relation into a plain operator name.
  const activities = (
    (activitiesRes.data ?? []) as unknown as (Omit<BuilderActivity, 'operator'> & {
      operator: OperatorRelation | OperatorRelation[] | null
    })[]
  ).map((a) => {
    const op = Array.isArray(a.operator) ? a.operator[0] : a.operator
    return {
      id: a.id,
      activity_date: a.activity_date,
      shift_type: a.shift_type,
      loads: a.loads,
      passes: a.passes,
      material_type: a.material_type,
      estimated_tonnes: a.estimated_tonnes,
      machine_id: a.machine_id,
      site_id: a.site_id,
      operator: op?.full_name ?? null,
    } satisfies BuilderActivity
  })

  // Aggregate machine hours into a machine_id -> total map.
  const hoursByMachine: Record<string, number> = {}
  for (const row of hoursRes.data ?? []) {
    const m = row as { machine_id: string; hours_worked: number | null }
    if (!m.machine_id) continue
    hoursByMachine[m.machine_id] = (hoursByMachine[m.machine_id] ?? 0) + (m.hours_worked ?? 0)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">Excavator Production Activity</h2>
        <p className="text-arch-text-muted text-sm">
          Add a site, choose an excavator filtered by that site, and review its prior production
          metrics — machine ID, operator, hours worked, loads, material, bin factor, and material
          moved.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400/10 rounded-lg text-yellow-400">
              <Shovel className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Total Loads (history)
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {activities.reduce((sum, a) => sum + (a.loads || 0), 0).toLocaleString()}
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-400/10 rounded-lg text-orange-400">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Estimated Tonnes (history)
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {activities
                  .reduce((sum, a) => sum + (a.estimated_tonnes || 0), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 1 })}
                t
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-400/10 rounded-lg text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Excavator Machines
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {machines.filter((m) => /excavator|shovel|backhoe|digger/i.test(m.machine_type))
                  .length || machines.length}
              </h4>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Interactive, sectioned excavator activity builder */}
      <ExcavatorActivityBuilder
        sites={sites}
        machines={machines}
        activities={activities}
        hoursByMachine={hoursByMachine}
      />
    </div>
  )
}
