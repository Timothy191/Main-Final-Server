import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { FileCheck, AlertTriangle, CheckCircle2, Eye, Shield } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getJSAMetrics, getJSAs } from './actions'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-600',
  reviewed: 'bg-blue-500/10 text-blue-600',
  approved: 'bg-emerald-500/10 text-emerald-600',
  superseded: 'bg-arch-surface-tertiary text-arch-text-muted',
}

const RISK_STYLES: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-rose-500/10 text-rose-600',
  critical: 'bg-red-500/10 text-red-600 animate-pulse',
}

async function JSAMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getJSAMetrics(deptId)
  const kpis = [
    {
      label: 'Total JSAs',
      value: metrics.total.toString(),
      icon: FileCheck,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Draft',
      value: metrics.draft.toString(),
      icon: Eye,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Reviewed',
      value: metrics.reviewed.toString(),
      icon: CheckCircle2,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Approved',
      value: metrics.approved.toString(),
      icon: Shield,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'High / Critical Risk',
      value: metrics.highRisk.toString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

async function JSATable({ deptId }: { deptId: string }) {
  const jsas = await getJSAs(deptId)
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Job Safety Analyses</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Approved and pending JSAs for high-risk work tasks
        </p>
      </div>
      {jsas.length === 0 ? (
        <div className="p-12 text-center">
          <FileCheck className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No JSAs recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">JSA #</th>
                <th className="px-4 py-3">Job Description</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Hazards</th>
                <th className="px-4 py-3 text-right">Risk</th>
                <th className="px-4 py-3">Valid From</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {jsas.map((jsa) => (
                <tr key={jsa.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-arch-text-primary">
                    {jsa.jsaNumber}
                  </td>
                  <td className="px-4 py-3 text-arch-text-primary max-w-[250px] truncate">
                    {jsa.jobDescription}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">{jsa.location ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {jsa.hazardsIdentified}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${RISK_STYLES[jsa.riskLevel] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {jsa.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted font-mono text-[10px]">
                    {jsa.validFrom}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[jsa.status] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {jsa.status}
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

export default async function JSAPage() {
  const { deptId } = await getDepartmentContext({ department: 'safety' })
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Job Safety Analyses</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Pre-task hazard identification, review and approval workflow
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <JSAMetricsSection deptId={deptId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <JSATable deptId={deptId} />
      </Suspense>
    </div>
  )
}
