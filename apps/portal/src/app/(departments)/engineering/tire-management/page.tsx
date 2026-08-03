import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { CircleDot, Wrench, ClipboardList, AlertTriangle } from 'lucide-react'
import { getEngineeringMetrics, getTires } from '../actions'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  'service-due': 'bg-amber-500/10 text-amber-600',
  critical: 'bg-rose-500/10 text-rose-600 animate-pulse',
  replaced: 'bg-arch-surface-tertiary text-arch-text-muted',
  decommissioned: 'bg-arch-surface-tertiary text-arch-text-muted',
}

export default async function TireManagementPage() {
  const { deptId } = await getDepartmentContext({
    department: 'engineering',
  })

  const [metrics, tires] = await Promise.all([getEngineeringMetrics(deptId), getTires(deptId)])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Tire Management</h2>
          <p className="text-sm text-arch-text-muted mt-1">
            Inspections, wear tracking &amp; replacement scheduling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-accent-green" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Total Tires Tracked
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">{metrics.totalTires}</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-arch-accent-blue" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Due for Service
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-accent-blue mt-2">{metrics.tireServiceDue}</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent-red" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Critical Alerts
            </p>
          </div>
          <p className="text-2xl font-bold text-accent-red mt-2">{metrics.tireCritical}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-arch-border-subtle flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-arch-text-primary">Tire Register</h3>
            <p className="text-sm text-arch-text-muted mt-1">
              Tread depth and pressure monitoring for the active fleet
            </p>
          </div>
        </div>

        {tires.length === 0 ? (
          <div className="p-12 text-center">
            <CircleDot className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <h3 className="text-lg font-semibold text-arch-text-primary mb-2">
              No tires registered yet
            </h3>
            <p className="text-sm text-arch-text-muted max-w-md mx-auto">
              Register tires to start tracking inspections, tread depth, pressure monitoring, and
              replacement schedules for the fleet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Tread (mm)</th>
                  <th className="px-4 py-3 text-right">Pressure (psi)</th>
                  <th className="px-4 py-3">Installed</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {tires.map((tire) => (
                  <tr key={tire.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 font-medium text-arch-text-primary">
                      {tire.machineName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-arch-text-secondary">{tire.position ?? '—'}</td>
                    <td className="px-4 py-3 text-arch-text-secondary">{tire.size ?? '—'}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        tire.treadDepthMm !== null && tire.treadDepthMm < 10
                          ? 'text-accent-red'
                          : 'text-arch-text-secondary'
                      }`}
                    >
                      {tire.treadDepthMm ?? '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        tire.pressurePsi !== null && tire.pressurePsi < 95
                          ? 'text-amber-600'
                          : 'text-arch-text-secondary'
                      }`}
                    >
                      {tire.pressurePsi ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">{tire.installedAt ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          STATUS_STYLES[tire.status] ??
                          'bg-arch-surface-tertiary text-arch-text-muted'
                        }`}
                      >
                        {tire.status === 'critical' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {tire.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
