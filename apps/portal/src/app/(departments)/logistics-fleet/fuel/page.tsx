import { GlassCard } from '@repo/ui/GlassCard'
import { Fuel } from 'lucide-react'
import { getFuelLogs } from '../actions'

export default async function FuelPage() {
  const fuelLogs = await getFuelLogs(200)

  const totalLitres = fuelLogs.reduce((sum, log) => sum + log.dieselLitres, 0)
  const uniqueMachines = new Set(fuelLogs.map((log) => log.machineName).filter(Boolean)).size

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Fuel & Consumption</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Diesel uplift logs linked to daily shift records
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-amber-400" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Total Uplifts Logged
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">
            {fuelLogs.length.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-accent-green" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Diesel Consumed (logged)
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">
            {Math.round(totalLitres).toLocaleString()} L
          </p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-blue-400" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Machines Refuelled
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">{uniqueMachines}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-arch-border-subtle">
          <h3 className="text-lg font-semibold text-arch-text-primary">Fuel Log</h3>
          <p className="text-sm text-arch-text-muted mt-1">
            Latest diesel uplifts across the fleet
          </p>
        </div>
        {fuelLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Fuel className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <p className="text-sm text-arch-text-muted">No fuel logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3 text-right">Diesel (L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {fuelLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 text-arch-text-primary">{log.logDate}</td>
                    <td className="px-4 py-3 text-arch-text-secondary">{log.machineName ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-arch-text-primary font-mono">
                      {log.dieselLitres.toLocaleString()}
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
