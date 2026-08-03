import { GlassCard } from '@repo/ui/GlassCard'
import { Truck } from 'lucide-react'
import Link from 'next/link'
import { getFleetList } from '../actions'

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-600',
  'In Service': 'bg-blue-500/10 text-blue-600',
  Inactive: 'bg-amber-500/10 text-amber-600',
  Decommissioned: 'bg-rose-500/10 text-rose-600',
}

const STATUS_FILTERS = ['All', 'Active', 'In Service', 'Inactive', 'Decommissioned']

export default async function FleetPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>
}) {
  const { status } = (await searchParams) ?? {}

  const fleet = await getFleetList()
  const filtered = status && status !== 'All' ? fleet.filter((v) => v.status === status) : fleet

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Fleet Register</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Heavy machinery, light vehicles and site assets
        </p>
      </div>

      {/* Status filters */}
      <GlassCard className="flex items-center gap-2 overflow-x-auto">
        <Truck className="w-4 h-4 text-arch-text-muted shrink-0" />
        {STATUS_FILTERS.map((option) => {
          const params = new URLSearchParams()
          if (option !== 'All') params.set('status', option)
          return (
            <Link
              key={option}
              href={`?${params.toString()}`}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 ${
                (status || 'All') === option
                  ? 'bg-[var(--text-heading)] text-white border-transparent'
                  : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
              }`}
            >
              {option}
            </Link>
          )
        })}
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <p className="text-sm text-arch-text-muted">No fleet vehicles match the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Make / Model</th>
                  <th className="px-4 py-3">Reg No</th>
                  <th className="px-4 py-3">Last Service</th>
                  <th className="px-4 py-3">Next Service</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {filtered.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 font-semibold text-arch-text-primary font-mono">
                      {vehicle.fleetCode}
                    </td>
                    <td className="px-4 py-3 text-arch-text-secondary">{vehicle.vehicleType}</td>
                    <td className="px-4 py-3 text-arch-text-secondary">
                      {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">
                      {vehicle.registrationNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">
                      {vehicle.lastServiceDate ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">
                      {vehicle.nextServiceDate ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          STATUS_STYLES[vehicle.status] ??
                          'bg-arch-surface-tertiary text-arch-text-muted'
                        }`}
                      >
                        {vehicle.status}
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
