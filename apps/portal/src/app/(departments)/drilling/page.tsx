import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { createReadReplicaClient } from '@repo/supabase/read-replica'
import { Drill, Clock, AlertTriangle } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@repo/ui/components/ui/skeleton'

async function getDrillingDashboardData(deptId: string, today: string) {
  const db = await createReadReplicaClient()

  const [
    { data: todayLogs },
    { count: machineCount },
    { data: todayOperations },
    { data: todayDelays },
  ] = await Promise.all([
    db
      .from('daily_logs')
      .select('id, log_date, shift')
      .eq('department_id', deptId)
      .eq('log_date', today)
      .order('shift'),
    db
      .from('machines')
      .select('*', { count: 'exact', head: true })
      .eq('machine_type', 'Drill Rig')
      .eq('active', true),
    db
      .from('drill_operations')
      .select('total_hours, status')
      .eq('department_id', deptId)
      .eq('operation_date', today),
    db
      .from('operational_delays')
      .select('delay_minutes, status')
      .eq('department_id', deptId)
      .eq('delay_date', today),
  ])

  const shiftCount = todayLogs?.length ?? 0
  const latestShift = todayLogs?.[todayLogs.length - 1]?.shift

  const totalHours =
    todayOperations?.reduce((sum, op) => sum + (Number(op.total_hours) || 0), 0) || 0

  const activeOps = todayOperations?.filter((op) => op.status === 'active').length || 0

  const delayCount = todayDelays?.length || 0
  const delayMinutes = todayDelays?.reduce((sum, d) => sum + (d.delay_minutes || 0), 0) || 0

  return {
    shiftCount,
    latestShift,
    machineCount: machineCount ?? 0,
    totalHours,
    activeOps,
    delayCount,
    delayMinutes,
  }
}

async function DrillingMetricsGrid({ deptId, today }: { deptId: string; today: string }) {
  const { shiftCount, latestShift, machineCount, totalHours, activeOps, delayCount, delayMinutes } =
    await getDrillingDashboardData(deptId, today)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <GlassCard>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-arch-accent-charcoal" />
          <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
            Today's Log
          </p>
        </div>
        <p className="text-2xl font-bold text-arch-text-primary mt-2">
          {shiftCount > 0 ? `${shiftCount} shift${shiftCount > 1 ? 's' : ''} logged` : 'Not logged'}
        </p>
        {latestShift && <p className="text-arch-text-muted text-xs mt-1">Latest: {latestShift}</p>}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Drill className="w-4 h-4 text-accent-green" />
          <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
            Active Drills
          </p>
        </div>
        <p className="text-2xl font-bold text-arch-text-primary mt-2">{machineCount}</p>
        {activeOps > 0 && (
          <p className="text-accent-green text-xs mt-1">
            {activeOps} operation{activeOps > 1 ? 's' : ''} active
          </p>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
            Hours Today
          </p>
        </div>
        <p className="text-2xl font-bold text-cyan-400 mt-2">{totalHours.toFixed(1)}h</p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-blue" />
          <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
            Delays
          </p>
        </div>
        <p className="text-2xl font-bold text-accent-blue mt-2">{delayCount}</p>
        {delayMinutes > 0 && (
          <p className="text-arch-text-muted text-xs mt-1">{delayMinutes} min lost</p>
        )}
      </GlassCard>
    </div>
  )
}

export default async function DrillingDashboardPage() {
  const { deptId, today } = await getDepartmentContext({
    department: 'drilling',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-arch-text-primary">Drilling Dashboard</h2>
        <p className="text-arch-text-muted text-sm">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-[140px] w-full" />
            <Skeleton className="h-[140px] w-full" />
            <Skeleton className="h-[140px] w-full" />
            <Skeleton className="h-[140px] w-full" />
          </div>
        }
      >
        <DrillingMetricsGrid deptId={deptId} today={today} />
      </Suspense>
    </div>
  )
}
