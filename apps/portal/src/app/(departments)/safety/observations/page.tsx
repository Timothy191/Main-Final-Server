import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Eye, AlertTriangle, CheckCircle2, Clock, Users, Shield } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getSafetyObservationsMetrics, getSafetyObservations } from './actions'

const OBS_TYPE_STYLES: Record<string, string> = {
  'safe-act': 'bg-emerald-500/10 text-emerald-600',
  'unsafe-act': 'bg-rose-500/10 text-rose-600',
  'unsafe-condition': 'bg-amber-500/10 text-amber-600',
  'good-catch': 'bg-blue-500/10 text-blue-600',
  'hazard-report': 'bg-violet-500/10 text-violet-600',
}

const RISK_STYLES: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-rose-500/10 text-rose-600',
  critical: 'bg-red-500/10 text-red-600 animate-pulse',
}

async function ObservationsMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getSafetyObservationsMetrics(deptId)
  const kpis = [
    {
      label: 'Total Observations',
      value: metrics.total.toString(),
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Open / In Progress',
      value: metrics.openCount.toString(),
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Closed',
      value: metrics.closedCount.toString(),
      icon: CheckCircle2,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'High/Critical',
      value: metrics.highCriticalCount.toString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Safe Acts Reported',
      value: metrics.safeActs.toString(),
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Hazard Reports',
      value: metrics.hazardReports.toString(),
      icon: Users,
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

async function ObservationsTable({ deptId }: { deptId: string }) {
  const observations = await getSafetyObservations(deptId)

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Safety Observations</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Safe acts, unsafe conditions, good catches and hazard reports
        </p>
      </div>
      {observations.length === 0 ? (
        <div className="p-12 text-center">
          <Eye className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No observations recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Risk</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 text-arch-text-primary font-mono text-[10px]">
                    {obs.observationDate}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${OBS_TYPE_STYLES[obs.observationType] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {obs.observationType.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-arch-text-primary max-w-[300px] truncate">
                    {obs.description}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">{obs.location ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${RISK_STYLES[obs.riskLevel] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {obs.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        obs.status === 'closed'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : obs.status === 'closed-verified'
                            ? 'bg-blue-500/10 text-blue-600'
                            : obs.status === 'in-progress'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-arch-surface-tertiary text-arch-text-muted'
                      }`}
                    >
                      {obs.status}
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

export default async function SafetyObservationsPage() {
  const { deptId } = await getDepartmentContext({ department: 'safety' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Safety Observations</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Safe act captures, unsafe condition reports and hazard management
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
        <ObservationsMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ObservationsTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
