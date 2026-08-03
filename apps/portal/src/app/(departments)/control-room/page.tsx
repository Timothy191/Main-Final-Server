import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import type { Metadata } from 'next'
import { MonitorDot, Shovel, AlertOctagon, StickyNote, Weight, Cpu } from 'lucide-react'
import {
  getControlRoomMetrics,
  getRecentMachineOperations,
  type ControlRoomMetrics,
  type RecentMachineOperation,
} from './actions'

export const metadata: Metadata = {
  title: 'Control Room | Arch OS',
  description: 'SCADA systems and real-time monitoring.',
}

/* ------------------------------------------------------------------ */
/*  Server component wrappers for streaming                            */
/* ------------------------------------------------------------------ */

async function ControlRoomMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getControlRoomMetrics(deptId)
  return <ControlRoomKPIGrid metrics={metrics} />
}

async function MachineOpsSection({ deptId }: { deptId: string }) {
  const ops = await getRecentMachineOperations(deptId, 8)
  return <MachineOpsTable ops={ops} />
}

/* ------------------------------------------------------------------ */
/*  UI sub-components                                                  */
/* ------------------------------------------------------------------ */

function ControlRoomKPIGrid({ metrics }: { metrics: ControlRoomMetrics }) {
  const kpis = [
    {
      label: 'Active Operations',
      value: metrics.activeMachineOps,
      icon: MonitorDot,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Machines In Ops',
      value: metrics.totalMachinesInOps,
      icon: Cpu,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Excavators Active',
      value: metrics.excavatorsActive,
      icon: Shovel,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Delays Today',
      value: metrics.delaysToday,
      icon: AlertOctagon,
      color: metrics.delaysToday > 0 ? 'text-red-400' : 'text-arch-text-muted',
      bg: metrics.delaysToday > 0 ? 'bg-red-400/10' : 'bg-white/5',
    },
    {
      label: 'Shift Notes Today',
      value: metrics.shiftNotesToday,
      icon: StickyNote,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Total Load Today (t)',
      value: metrics.totalTonnageToday.toLocaleString(),
      icon: Weight,
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

function MachineOpsTable({ ops }: { ops: RecentMachineOperation[] }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <MonitorDot className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Recent Machine Operations
        </h3>
      </div>
      {ops.length === 0 ? (
        <p className="text-arch-text-muted text-sm">No machine operations logged today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-arch-text-muted text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left pb-2">Machine</th>
                <th className="text-left pb-2">Type</th>
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Shift</th>
                <th className="text-right pb-2">Hours</th>
                <th className="text-left pb-2">Site</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 font-medium text-arch-text-primary">{op.machineName}</td>
                  <td className="py-2 text-arch-text-muted text-xs">{op.machineType}</td>
                  <td className="py-2 text-arch-text-muted">{op.shiftDate}</td>
                  <td className="py-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        op.shiftType === 'day'
                          ? 'bg-yellow-400/20 text-yellow-400'
                          : 'bg-blue-400/20 text-blue-400'
                      }`}
                    >
                      {op.shiftType}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono text-arch-text-primary">
                    {op.hoursWorked !== null ? (
                      op.hoursWorked.toFixed(1)
                    ) : (
                      <span className="text-accent-green text-xs">In Progress</span>
                    )}
                  </td>
                  <td className="py-2 text-arch-text-muted text-xs">{op.siteName ?? '—'}</td>
                </tr>
              ))}
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

export default async function ControlRoomPage() {
  const { deptId } = await getDepartmentContext({ department: 'control-room' })

  return (
    <div className="space-y-6">
      {/* SCADA KPI cards — cached, streamed independently */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <ControlRoomMetricsSection deptId={deptId} />
      </Suspense>

      {/* Machine operations table — dynamic, streamed independently */}
      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <MachineOpsSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
