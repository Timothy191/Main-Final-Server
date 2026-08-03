import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import type { Metadata } from 'next'
import { BarChart3, Layers, Truck, ClipboardList, TrendingUp, ArrowDownUp } from 'lucide-react'
import {
  getProductionMetrics,
  getRecentProductionLogs,
  type ProductionMetrics,
  type RecentProductionLog,
} from './actions'

export const metadata: Metadata = {
  title: 'Production | Arch OS',
  description: 'Coal yield, tonnage and extraction tracking.',
}

/* ------------------------------------------------------------------ */
/*  Server component wrappers for streaming                            */
/* ------------------------------------------------------------------ */

async function ProductionMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getProductionMetrics(deptId)
  return <ProductionMetricsGrid metrics={metrics} />
}

async function ProductionLogsSection({ deptId }: { deptId: string }) {
  const logs = await getRecentProductionLogs(deptId, 8)
  return <ProductionLogsTable logs={logs} />
}

/* ------------------------------------------------------------------ */
/*  UI sub-components                                                  */
/* ------------------------------------------------------------------ */

function ProductionMetricsGrid({ metrics }: { metrics: ProductionMetrics }) {
  const kpis = [
    {
      label: 'Coal Tonnes Today',
      value: metrics.coalTonnesToday.toLocaleString(),
      icon: BarChart3,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Waste Tonnes Today',
      value: metrics.wasteTonnesToday.toLocaleString(),
      icon: Layers,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Strip Ratio',
      value: metrics.stripRatio.toFixed(2),
      icon: ArrowDownUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Active Machines',
      value: `${metrics.activeMachines} / ${metrics.totalMachines}`,
      icon: Truck,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Shift Logs Today',
      value: metrics.dailyLogsToday.toString(),
      icon: ClipboardList,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Productivity',
      value:
        metrics.totalMachines > 0
          ? `${Math.round((metrics.activeMachines / metrics.totalMachines) * 100)}%`
          : '—',
      icon: TrendingUp,
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

function ProductionLogsTable({ logs }: { logs: RecentProductionLog[] }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Recent Shift Logs
        </h3>
      </div>
      {logs.length === 0 ? (
        <p className="text-arch-text-muted text-sm">No production logs recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-arch-text-muted text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Shift</th>
                <th className="text-right pb-2">Coal (t)</th>
                <th className="text-right pb-2">Waste (t)</th>
                <th className="text-right pb-2">Strip Ratio</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const strip =
                  log.coalTonnes > 0 ? (log.wasteTonnes / log.coalTonnes).toFixed(2) : '—'
                return (
                  <tr
                    key={log.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-2 text-arch-text-primary">{log.logDate}</td>
                    <td className="py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          log.shift === 'day'
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : 'bg-blue-400/20 text-blue-400'
                        }`}
                      >
                        {log.shift}
                      </span>
                    </td>
                    <td className="py-2 text-right text-arch-text-primary font-mono">
                      {log.coalTonnes.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-arch-text-muted font-mono">
                      {log.wasteTonnes.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-arch-text-muted font-mono">{strip}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProductionPage() {
  const { deptId } = await getDepartmentContext({ department: 'production' })

  return (
    <div className="space-y-6">
      {/* KPI metrics — streamed independently */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <ProductionMetricsSection deptId={deptId} />
      </Suspense>

      {/* Recent shift log table — streamed independently */}
      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <ProductionLogsSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
