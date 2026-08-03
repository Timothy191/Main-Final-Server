import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { ClipboardList, CheckCircle2, Clock, Map, Target } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getSurveyPlanMetrics, getSurveyPlans } from './actions'

const STATUS_STYLES: Record<string, string> = {
  planned: 'bg-blue-500/10 text-blue-600',
  'in-progress': 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-arch-surface-tertiary text-arch-text-muted',
}

async function SurveyPlanMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getSurveyPlanMetrics(deptId)
  const kpis = [
    {
      label: 'Total Plans',
      value: metrics.total.toString(),
      icon: ClipboardList,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Planned',
      value: metrics.planned.toString(),
      icon: Target,
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
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

async function SurveyPlansTable({ deptId }: { deptId: string }) {
  const plans = await getSurveyPlans(deptId)
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Survey Plans</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Topographic, control, cadastral and monitoring survey schedules
        </p>
      </div>
      {plans.length === 0 ? (
        <div className="p-12 text-center">
          <Map className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No survey plans created yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Plan Name</th>
                <th className="px-4 py-3">Block</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Area (ha)</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3">Planned</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 font-medium text-arch-text-primary">{plan.planName}</td>
                  <td className="px-4 py-3 text-arch-text-muted">{plan.blockName ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-arch-text-secondary">
                    {plan.surveyType}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {plan.areaSizeHa ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {plan.pointCount ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-arch-text-primary">{plan.plannedDate ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[plan.status] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {plan.status}
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

export default async function SurveyPlansPage() {
  const { deptId } = await getDepartmentContext({ department: 'geology' })
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Survey Plans</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Planned and completed survey schedules for topographic, control and monitoring work
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <SurveyPlanMetricsSection deptId={deptId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SurveyPlansTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
