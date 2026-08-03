import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { BellRing, AlertTriangle, Mountain, Waves, Eye, Radio } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getSatelliteAlertMetrics, getSatelliteAlerts } from './actions'

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-600',
  warning: 'bg-amber-500/10 text-amber-600',
  critical: 'bg-rose-500/10 text-rose-600 animate-pulse',
}

async function AlertMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getSatelliteAlertMetrics(deptId)
  const kpis = [
    {
      label: 'Total Alerts',
      value: metrics.total.toString(),
      icon: BellRing,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Unreviewed',
      value: metrics.unreviewed.toString(),
      icon: Eye,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Warnings',
      value: metrics.warnings.toString(),
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Critical',
      value: metrics.critical.toString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Deformation',
      value: metrics.deformation.toString(),
      icon: Mountain,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
    {
      label: 'Subsidence',
      value: metrics.subsidence.toString(),
      icon: Waves,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
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

async function AlertsTable({ deptId }: { deptId: string }) {
  const alerts = await getSatelliteAlerts(deptId)
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Detection Alerts</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          SAR, InSAR, hyperspectral and thermal anomaly detections
        </p>
      </div>
      {alerts.length === 0 ? (
        <div className="p-12 text-center">
          <Radio className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No satellite alerts recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Detected</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Confidence</th>
                <th className="px-4 py-3 text-right">Severity</th>
                <th className="px-4 py-3 text-right">Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 text-arch-text-muted font-mono text-[10px]">
                    {alert.detectedAt}
                  </td>
                  <td className="px-4 py-3 capitalize text-arch-text-secondary">
                    {alert.alertType.replace('-', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-arch-surface-chrome-medium font-medium text-arch-text-secondary">
                      {alert.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-arch-text-primary max-w-[250px] truncate">
                    {alert.description ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {alert.confidencePct}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SEVERITY_STYLES[alert.severity] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${alert.reviewed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
                    >
                      {alert.reviewed ? 'Reviewed' : 'Pending'}
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

export default async function SatelliteAlertsPage() {
  const { deptId } = await getDepartmentContext({ department: 'satellite-monitoring' })
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Satellite Alerts</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Deformation, subsidence and anomaly detections requiring review
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
        <AlertMetricsSection deptId={deptId} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AlertsTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
