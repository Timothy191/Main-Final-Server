import { createServerSupabaseClient } from '@repo/supabase/server'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import { Badge } from '@repo/ui/components/ui/badge'
import { Shovel, Weight, Zap, MapPin, User, FileText } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Excavator Activity | Control Room | Arch OS',
  description: 'Live excavator operations, payload tracking, and cycle times.',
}

interface ExcavatorActivityRow {
  id: string
  activity_date: string
  shift_type: string
  loads: number
  passes: number
  avg_cycle_time_seconds: number | null
  estimated_tonnes: number | null
  material_type: string | null
  notes: string | null
  machine: { name: string; machine_type: string } | { name: string; machine_type: string }[] | null
  site: { name: string } | { name: string }[] | null
  operator: { full_name: string } | { full_name: string }[] | null
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

  // Fetch excavator activities
  const { data: activities, error } = await supabase
    .from('excavator_activity')
    .select(
      `
      id,
      activity_date,
      shift_type,
      loads,
      passes,
      avg_cycle_time_seconds,
      estimated_tonnes,
      material_type,
      notes,
      machine:machines(name, machine_type),
      site:sites(name),
      operator:employees(full_name)
    `
    )
    .eq('department_id', deptId)
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to load excavator activities: ${error.message}`)
  }

  const typedActivities = (activities || []) as unknown as ExcavatorActivityRow[]

  // Calculate statistics
  const totalLoads = typedActivities.reduce((sum, act) => sum + act.loads, 0)
  const totalTonnes = typedActivities.reduce((sum, act) => sum + (act.estimated_tonnes || 0), 0)

  const validCycleTimes = typedActivities.filter(
    (act) => act.avg_cycle_time_seconds !== null && act.avg_cycle_time_seconds > 0
  )
  const avgCycleTime =
    validCycleTimes.length > 0
      ? validCycleTimes.reduce((sum, act) => sum + (act.avg_cycle_time_seconds || 0), 0) /
        validCycleTimes.length
      : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">Excavator Production Activity</h2>
        <p className="text-arch-text-muted text-sm">
          Detailed metrics for excavators and shovels on shift, showing loading passes, bucket
          weights, and operator efficiency.
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
                Total Loads Today
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {totalLoads.toLocaleString()}
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
                Estimated Tonnes
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {totalTonnes.toLocaleString(undefined, { maximumFractionDigits: 1 })}t
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
                Avg Cycle Time
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {avgCycleTime > 0 ? `${avgCycleTime.toFixed(1)}s` : '—'}
              </h4>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Excavator Activity Log Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Excavator</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Operator</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Location / Material</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Shift</TableHead>
                <TableHead className="px-4 py-3 text-center">Loads / Passes</TableHead>
                <TableHead className="px-4 py-3 text-center">Cycle Time</TableHead>
                <TableHead className="px-4 py-3 text-center">Payload</TableHead>
                <TableHead className="px-4 py-3 text-right">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {typedActivities.length > 0 ? (
                typedActivities.map((row) => {
                  const machineData = Array.isArray(row.machine) ? row.machine[0] : row.machine
                  const siteData = Array.isArray(row.site) ? row.site[0] : row.site
                  const operatorData = Array.isArray(row.operator) ? row.operator[0] : row.operator

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shovel className="w-4 h-4 text-arch-text-secondary" />
                          <div>
                            <span className="font-semibold text-arch-text-primary block">
                              {machineData?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-arch-text-muted">
                              {machineData?.machine_type || 'Excavator'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary font-medium">
                        {operatorData?.full_name || 'No Operator'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <MapPin className="w-3.5 h-3.5 text-arch-text-muted" />
                          <span>{siteData?.name || 'Not assigned'}</span>
                        </div>
                        {row.material_type && (
                          <Badge className="bg-white/5 text-arch-text-secondary border-white/10 text-[10px] py-0 px-1 hover:bg-white/10 capitalize">
                            {row.material_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-arch-text-secondary">
                            {row.activity_date}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                              row.shift_type === 'day'
                                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                                : 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20'
                            }`}
                          >
                            {row.shift_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="font-semibold text-arch-text-primary">
                          {row.loads} loads
                        </div>
                        <div className="text-xs text-arch-text-muted">
                          {row.passes} passes (
                          {row.loads > 0 ? (row.passes / row.loads).toFixed(1) : 0} avg)
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {row.avg_cycle_time_seconds ? (
                          <span className="font-mono text-arch-text-primary font-bold">
                            {row.avg_cycle_time_seconds.toFixed(1)}s
                          </span>
                        ) : (
                          <span className="text-arch-text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center font-bold text-orange-400 font-mono">
                        {row.estimated_tonnes ? (
                          `${row.estimated_tonnes.toLocaleString(undefined, { maximumFractionDigits: 1 })}t`
                        ) : (
                          <span className="text-arch-text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right max-w-[200px] truncate text-arch-text-muted text-xs">
                        {row.notes || '—'}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-8 text-center text-arch-text-muted">
                    No excavator activity logged for this department.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  )
}
