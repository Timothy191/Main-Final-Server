import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Wrench, CheckCircle2, Clock, AlertTriangle, Calendar, Settings } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getMaintenanceMetrics, getMaintenanceJobs } from './actions'

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600',
  'in-progress': 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  overdue: 'bg-rose-500/10 text-rose-600 animate-pulse',
  cancelled: 'bg-arch-surface-tertiary text-arch-text-muted',
}

async function MaintenanceMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getMaintenanceMetrics(deptId)
  const kpis = [
    {
      label: 'Total Jobs',
      value: metrics.total.toString(),
      icon: Wrench,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Scheduled',
      value: metrics.scheduled.toString(),
      icon: Calendar,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'In Progress',
      value: metrics.inProgress.toString(),
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Completed',
      value: metrics.completed.toString(),
      icon: CheckCircle2,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Overdue',
      value: metrics.overdue.toString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Completion Rate',
      value: metrics.total > 0 ? `${Math.round((metrics.completed / metrics.total) * 100)}%` : '0%',
      icon: Settings,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <GlassCard key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={`p-2 ${kpi.bg} rounded-lg flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-arch-text-primary mt-0.5">{kpi.value}</p>
              </div>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}

async function MaintenanceTable({ deptId }: { deptId: string }) {
  const jobs = await getMaintenanceJobs(deptId)
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Fleet Maintenance Schedule</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Scheduled services, inspections and major overhauls
        </p>
      </div>
      {jobs.length === 0 ? (
        <div className="p-12 text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No maintenance jobs scheduled.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Fleet Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3 text-right">Est. Hours</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-arch-text-primary">
                    {job.fleetCode ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-arch-text-secondary">{job.vehicleType ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-arch-text-secondary">
                    {job.serviceType.replace('-', ' ')}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted max-w-[200px] truncate">
                    {job.description}
                  </td>
                  <td className="px-4 py-3 text-arch-text-primary">{job.scheduledDate}</td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {job.estimatedHours ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[job.status] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  )
}

export default async function MaintenancePage() {
  const { deptId } = await getDepartmentContext({ department: 'logistics-fleet' })
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Fleet Maintenance</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Scheduled services, inspections, and major overhaul planning
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <MaintenanceMetricsSection deptId={deptId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <MaintenanceTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
