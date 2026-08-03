import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Truck, CheckCircle2, Wrench, AlertTriangle, Fuel, CalendarClock } from 'lucide-react'
import { getLogisticsMetrics, getFuelLogs } from './actions'

const _STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-600',
  'In Service': 'bg-blue-500/10 text-blue-600',
  Inactive: 'bg-amber-500/10 text-amber-600',
  Decommissioned: 'bg-rose-500/10 text-rose-600',
}

async function LogisticsMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getLogisticsMetrics(deptId)
  const kpis = [
    {
      label: 'Total Fleet',
      value: metrics.totalFleet.toString(),
      icon: Truck,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Active',
      value: metrics.activeFleet.toString(),
      icon: CheckCircle2,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'In Service',
      value: metrics.inService.toString(),
      icon: Wrench,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Out of Service',
      value: metrics.outOfService.toString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Fuel Today (L)',
      value: Math.round(metrics.fuelLitresToday).toLocaleString(),
      icon: Fuel,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Maintenance Due (7d)',
      value: metrics.maintenanceDue.toString(),
      icon: CalendarClock,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
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

async function RecentFuelSection() {
  const fuelLogs = await getFuelLogs(8)

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Fuel className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Recent Fuel Uplifts
        </h3>
      </div>
      {fuelLogs.length === 0 ? (
        <p className="text-arch-text-muted text-sm">No fuel logs recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-arch-text-muted text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Machine</th>
                <th className="text-right pb-2">Litres</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 text-arch-text-primary">{log.logDate}</td>
                  <td className="py-2">{log.machineName ?? '—'}</td>
                  <td className="py-2 text-right text-arch-text-primary font-mono">
                    {log.dieselLitres.toLocaleString()}
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

export default async function LogisticsFleetDashboardPage() {
  const { deptId } = await getDepartmentContext({ department: 'logistics-fleet' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-arch-text-primary">
          Logistics & Fleet Overview
        </h2>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <LogisticsMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
        <RecentFuelSection />
      </Suspense>
    </div>
  )
}
