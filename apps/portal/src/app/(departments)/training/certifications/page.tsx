import { GlassCard } from '@repo/ui/GlassCard'
import { Award, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'
import { SearchForm } from '../components/SearchForm'
import { FilterTabs } from '../components/FilterTabs'
import { getCertifications } from '../actions'
import { getDepartmentContext } from '@/lib/dept-context'

export default async function CertificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>
}) {
  const { deptId } = await getDepartmentContext({ department: 'training' })
  const { q, status } = (await searchParams) ?? {}

  const certifications = await getCertifications(deptId, { q, status })

  const activeCount = certifications.filter((c) => c.status === 'active').length
  const expiringCount = certifications.filter((c) => c.status === 'expiring').length
  const expiredCount = certifications.filter((c) => c.status === 'expired').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">
            Certifications & Competencies
          </h2>
          <p className="text-arch-text-muted text-sm mt-0.5">
            Audit and manage site-wide equipment licenses, regulatory tickets, and safety training.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-arch-text-muted text-xs font-semibold uppercase tracking-wider">
              Active Credentials
            </p>
            <p className="text-2xl font-bold text-arch-text-primary">{activeCount}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-arch-text-muted text-xs font-semibold uppercase tracking-wider">
              Expiring within 30d
            </p>
            <p className="text-2xl font-bold text-arch-text-primary">{expiringCount}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-arch-text-muted text-xs font-semibold uppercase tracking-wider">
              Expired / Suspended
            </p>
            <p className="text-2xl font-bold text-arch-text-primary">{expiredCount}</p>
          </div>
        </GlassCard>
      </div>

      {/* Search & Table list */}
      <GlassCard className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <SearchForm
            value={q}
            placeholder="Search employee, cert, or role..."
            hiddenParams={status && status !== 'All' ? { status } : {}}
          />
          <FilterTabs
            paramName="status"
            options={['All', 'active', 'expiring', 'expired']}
            currentValue={status || 'All'}
            hiddenParams={q ? { q } : {}}
          />
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] text-arch-text-muted font-semibold">
                <th className="pb-2">Employee</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Certification</th>
                <th className="pb-2">Issue Date</th>
                <th className="pb-2">Expiry Date</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {certifications.length > 0 ? (
                certifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="py-3 font-medium text-arch-text-primary">{cert.employeeName}</td>
                    <td className="py-3 text-arch-text-muted">{cert.role ?? '—'}</td>
                    <td className="py-3 font-semibold text-arch-text-primary flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-arch-accent-charcoal" />
                      <span>{cert.certification}</span>
                    </td>
                    <td className="py-3 text-arch-text-muted">{cert.issueDate}</td>
                    <td className="py-3 text-arch-text-muted">{cert.expiryDate}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          cert.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : cert.status === 'expiring'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-600 animate-pulse'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-arch-text-muted">
                    No certifications found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
