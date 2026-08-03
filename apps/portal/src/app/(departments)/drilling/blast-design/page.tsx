import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Crosshair, Zap, Target, Mountain, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getBlastDesigns, getBlastMetrics } from '../actions'

const STATUS_STYLES: Record<string, string> = {
  designed: 'bg-blue-500/10 text-blue-600',
  loaded: 'bg-amber-500/10 text-amber-600',
  fired: 'bg-rose-500/10 text-rose-600',
  mucked: 'bg-violet-500/10 text-violet-600',
  reviewed: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-arch-surface-tertiary text-arch-text-muted',
}

async function BlastMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getBlastMetrics(deptId)
  const kpis = [
    {
      label: 'Total Blasts',
      value: metrics.totalBlasts.toString(),
      icon: Crosshair,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Designed',
      value: metrics.designedBlasts.toString(),
      icon: Target,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Fired',
      value: metrics.firedBlasts.toString(),
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Total Tonnes',
      value: `${Math.round(metrics.totalDesignedTonnes / 1000)}kt`,
      icon: Mountain,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Reviewed',
      value: metrics.reviewedBlasts.toString(),
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: 'Cancelled',
      value: metrics.cancelledBlasts.toString(),
      icon: AlertTriangle,
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

async function BlastDesignsTable({ deptId }: { deptId: string }) {
  const blasts = await getBlastDesigns(deptId)

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Blast Register</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Blast designs, loading status, and firing records
        </p>
      </div>
      {blasts.length === 0 ? (
        <div className="p-12 text-center">
          <Crosshair className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No blast designs created yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Blast Name</th>
                <th className="px-4 py-3">Block</th>
                <th className="px-4 py-3 text-right">Holes</th>
                <th className="px-4 py-3 text-right">Tonnes</th>
                <th className="px-4 py-3">Explosive</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {blasts.map((blast) => (
                <tr key={blast.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 font-medium text-arch-text-primary">
                    {blast.blastName}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">{blast.blockName ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-primary">
                    {blast.actualHoles ?? blast.designedHoles}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {blast.designedTonnes ? `${(blast.designedTonnes / 1000).toFixed(1)}kt` : '—'}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">{blast.explosiveType ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[blast.status] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {blast.status}
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

export default async function BlastDesignPage() {
  const { deptId } = await getDepartmentContext({ department: 'drilling' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Blast Design</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Blast planning, hole loading, firing and muck-pile review
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
        <BlastMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <BlastDesignsTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
