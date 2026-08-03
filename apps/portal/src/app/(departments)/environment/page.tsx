import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import {
  Leaf,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Wind,
  CheckCircle2,
} from 'lucide-react'
import { getEnvironmentMetrics, getRecentReadings } from './actions'

const STATUS_STYLES: Record<string, string> = {
  'within-limit': 'bg-emerald-500/10 text-emerald-600',
  exceeded: 'bg-rose-500/10 text-rose-600 animate-pulse',
  'under-investigation': 'bg-amber-500/10 text-amber-600',
}

async function EnvironmentMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getEnvironmentMetrics(deptId)
  const kpis = [
    {
      label: 'Compliance Rate',
      value: `${metrics.complianceRate}%`,
      icon: CheckCircle2,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Readings Today',
      value: metrics.readingsToday.toString(),
      icon: Activity,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Limit Exceedances',
      value: metrics.exceededCount.toString(),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Under Investigation',
      value: metrics.underInvestigation.toString(),
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Dust Samples',
      value: metrics.dustReadings.toString(),
      icon: Wind,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Water Samples',
      value: metrics.waterReadings.toString(),
      icon: Droplets,
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

async function RecentReadingsSection({ deptId }: { deptId: string }) {
  const readings = await getRecentReadings(deptId, 6)

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Recent Environmental Readings
        </h3>
      </div>
      {readings.length === 0 ? (
        <p className="text-arch-text-muted text-sm">No environmental readings recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-arch-text-muted text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Type</th>
                <th className="text-left pb-2">Location</th>
                <th className="text-right pb-2">Value</th>
                <th className="text-right pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr
                  key={reading.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 text-arch-text-primary">{reading.readingDate}</td>
                  <td className="py-2 capitalize">{reading.readingType}</td>
                  <td className="py-2 text-arch-text-muted">{reading.location ?? '—'}</td>
                  <td className="py-2 text-right text-arch-text-primary font-mono">
                    {reading.value} {reading.unit}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_STYLES[reading.status] ?? 'bg-white/10 text-arch-text-muted'
                      }`}
                    >
                      {reading.status}
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

export default async function EnvironmentDashboardPage() {
  const { deptId } = await getDepartmentContext({ department: 'environment' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-arch-text-primary">Environmental Monitoring</h2>
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
        <EnvironmentMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <RecentReadingsSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
