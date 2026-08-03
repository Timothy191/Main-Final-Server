import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { FlaskConical, Clock, CheckCircle2, FileSearch, Award, Flame } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getGradeControlMetrics, getGradeSamples } from './actions'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  'in-lab': 'bg-blue-500/10 text-blue-600',
  'results-received': 'bg-violet-500/10 text-violet-600',
  reviewed: 'bg-emerald-500/10 text-emerald-600',
}

async function GradeControlMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getGradeControlMetrics(deptId)
  const kpis = [
    {
      label: 'Total Samples',
      value: metrics.total.toString(),
      icon: FlaskConical,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Pending',
      value: metrics.pending.toString(),
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'In Lab',
      value: metrics.inLab.toString(),
      icon: FileSearch,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Results Received',
      value: metrics.resultsReceived.toString(),
      icon: CheckCircle2,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
    {
      label: 'Avg Ash',
      value: `${metrics.avgAsh}%`,
      icon: Award,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Avg CV',
      value: `${metrics.avgCalorific} kcal/kg`,
      icon: Flame,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
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

async function GradeSamplesTable({ deptId }: { deptId: string }) {
  const samples = await getGradeSamples(deptId)
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Grade Control Samples</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Blast-hole, chip, channel and ROM quality samples
        </p>
      </div>
      {samples.length === 0 ? (
        <div className="p-12 text-center">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No grade control samples recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Block</th>
                <th className="px-4 py-3 text-right">Ash %</th>
                <th className="px-4 py-3 text-right">Sulphur %</th>
                <th className="px-4 py-3 text-right">CV (kcal/kg)</th>
                <th className="px-4 py-3 text-right">Moisture %</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {samples.map((sample) => (
                <tr key={sample.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 text-arch-text-primary font-mono text-[10px]">
                    {sample.sampleDate}
                  </td>
                  <td className="px-4 py-3 capitalize text-arch-text-secondary">
                    {sample.sampleType}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">
                    {sample.blockName ?? sample.location ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {sample.ashPct ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {sample.sulphurPct ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-primary">
                    {sample.calorificValue ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {sample.moisturePct ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[sample.status] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {sample.status.replace('-', ' ')}
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

export default async function GradeControlPage() {
  const { deptId } = await getDepartmentContext({ department: 'production' })
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Grade Control</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Quality sample tracking for blast-hole, chip, channel and ROM analysis
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
        <GradeControlMetricsSection deptId={deptId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <GradeSamplesTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
