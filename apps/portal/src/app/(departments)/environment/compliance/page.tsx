import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getEnvironmentMetrics, getEnvironmentalReadings } from '../actions'

async function ComplianceSection({ deptId }: { deptId: string }) {
  const [metrics, flagged] = await Promise.all([
    getEnvironmentMetrics(deptId),
    getEnvironmentalReadings(deptId, { status: 'exceeded' }, 50),
  ])

  const investigation = await getEnvironmentalReadings(
    deptId,
    { status: 'under-investigation' },
    50
  )

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                Compliance Rate
              </p>
              <p className="text-2xl font-bold text-arch-text-primary">{metrics.complianceRate}%</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                Limit Exceedances
              </p>
              <p className="text-2xl font-bold text-arch-text-primary">{metrics.exceededCount}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                Under Investigation
              </p>
              <p className="text-2xl font-bold text-arch-text-primary">
                {metrics.underInvestigation}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Exceedances */}
      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-arch-border-subtle">
          <h3 className="text-lg font-semibold text-arch-text-primary">
            Limit Exceedances & Escalations
          </h3>
          <p className="text-sm text-arch-text-muted mt-1">
            Readings flagged above statutory limits, including items under investigation
          </p>
        </div>
        {[...flagged, ...investigation].length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-40" />
            <p className="text-sm text-arch-text-muted">
              No limit exceedances. All readings are within statutory limits. ✅
            </p>
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
                {[...flagged, ...investigation].map((reading) => (
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
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          reading.status === 'exceeded'
                            ? 'bg-rose-500/10 text-rose-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
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

export default async function EnvironmentCompliancePage() {
  const { deptId } = await getDepartmentContext({ department: 'environment' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Environmental Compliance</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Statutory limit monitoring and escalation tracking
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <ComplianceSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
