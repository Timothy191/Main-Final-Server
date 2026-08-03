import { GlassCard } from '@repo/ui/GlassCard'
import { Activity, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getDepartmentContext } from '@/lib/dept-context'
import { getEnvironmentalReadings } from '../actions'

const STATUS_STYLES: Record<string, string> = {
  'within-limit': 'bg-emerald-500/10 text-emerald-600',
  exceeded: 'bg-rose-500/10 text-rose-600 animate-pulse',
  'under-investigation': 'bg-amber-500/10 text-amber-600',
}

const TYPE_FILTERS = ['All', 'dust', 'water', 'noise', 'emissions', 'weather']
const STATUS_FILTERS = ['All', 'within-limit', 'exceeded', 'under-investigation']

export default async function ReadingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; status?: string }>
}) {
  const { deptId } = await getDepartmentContext({ department: 'environment' })
  const { type, status } = (await searchParams) ?? {}

  const readings = await getEnvironmentalReadings(deptId, { type, status })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Environmental Readings</h2>
          <p className="text-arch-text-muted text-sm mt-0.5">
            Dust, water, noise, emissions and weather monitoring samples
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Activity className="w-4 h-4 text-arch-text-muted shrink-0" />
          {TYPE_FILTERS.map((option) => {
            const params = new URLSearchParams()
            if (status && status !== 'All') params.set('status', status)
            if (option !== 'All') params.set('type', option)
            const href = `?${params.toString()}`
            return (
              <Link
                key={option}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 capitalize ${
                  (type || 'All') === option
                    ? 'bg-[var(--text-heading)] text-white border-transparent'
                    : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
                }`}
              >
                {option}
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((option) => {
            const params = new URLSearchParams()
            if (type && type !== 'All') params.set('type', type)
            if (option !== 'All') params.set('status', option)
            const href = `?${params.toString()}`
            return (
              <Link
                key={option}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 ${
                  (status || 'All') === option
                    ? 'bg-arch-accent-charcoal text-white border-transparent'
                    : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
                }`}
              >
                {option.replace('-', ' ')}
              </Link>
            )
          })}
        </div>
      </GlassCard>

      {/* Readings table */}
      <GlassCard className="overflow-hidden p-0">
        {readings.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <p className="text-sm text-arch-text-muted">No readings match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 text-arch-text-primary">{reading.readingDate}</td>
                    <td className="px-4 py-3 capitalize text-arch-text-secondary">
                      {reading.readingType}
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">{reading.location ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-arch-text-primary font-mono">
                      {reading.value} {reading.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          STATUS_STYLES[reading.status] ??
                          'bg-arch-surface-tertiary text-arch-text-muted'
                        }`}
                      >
                        {reading.status === 'exceeded' && <AlertTriangle className="w-2.5 h-2.5" />}
                        {reading.status.replace('-', ' ')}
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
