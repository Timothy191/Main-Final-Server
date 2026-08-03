import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { AlertTriangle, Droplets, Wind, Scale, CheckCircle2 } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getEnvironmentalIncidents, getEnvIncidentMetrics } from './actions'

const SEVERITY_STYLES: Record<string, string> = {
  minor: 'bg-amber-500/10 text-amber-600',
  moderate: 'bg-orange-500/10 text-orange-600',
  major: 'bg-rose-500/10 text-rose-600',
  critical: 'bg-red-500/10 text-red-600 animate-pulse',
}

async function IncidentMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getEnvIncidentMetrics(deptId)
  const kpis = [
    {
      label: 'Total Incidents',
      value: metrics.total.toString(),
      icon: AlertTriangle,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Open / Investigating',
      value: metrics.openInvestigating.toString(),
      icon: Wind,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Resolved / Closed',
      value: metrics.resolvedClosed.toString(),
      icon: CheckCircle2,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Spill Incidents',
      value: metrics.spillCount.toString(),
      icon: Droplets,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Emission Exceedances',
      value: metrics.emissionCount.toString(),
      icon: Wind,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Regulatory Notified',
      value: metrics.regulatoryNotified.toString(),
      icon: Scale,
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

async function IncidentsTable({ deptId }: { deptId: string }) {
  const incidents = await getEnvironmentalIncidents(deptId)

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Environmental Incidents</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Spills, emission exceedances, water contamination and complaints
        </p>
      </div>
      {incidents.length === 0 ? (
        <div className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No environmental incidents recorded.</p>
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
                <th className="px-4 py-3 text-right">Severity</th>
                <th className="px-4 py-3 text-right">Regulatory</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 text-arch-text-primary font-mono text-[10px]">
                    {inc.incidentDate}
                  </td>
                  <td className="px-4 py-3 capitalize text-arch-text-secondary">
                    {inc.incidentType.replace('-', ' ')}
                  </td>
                  <td className="px-4 py-3 text-arch-text-primary max-w-[250px] truncate">
                    {inc.description}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">{inc.location ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SEVERITY_STYLES[inc.severity] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${inc.regulatoryNotified ? 'bg-amber-500/10 text-amber-600' : 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {inc.regulatoryNotified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        inc.status === 'closed'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : inc.status === 'resolved'
                            ? 'bg-blue-500/10 text-blue-600'
                            : inc.status === 'investigating'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-arch-surface-tertiary text-arch-text-muted'
                      }`}
                    >
                      {inc.status}
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

export default async function EnvironmentalIncidentsPage() {
  const { deptId } = await getDepartmentContext({ department: 'environment' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Environmental Incidents</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Spills, emission exceedances, water contamination and regulatory notifications
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
        <IncidentMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <IncidentsTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
