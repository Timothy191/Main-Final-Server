import { GlassCard } from '@repo/ui/GlassCard'
import { Award, CheckCircle, AlertTriangle, AlertOctagon, Plus } from 'lucide-react'
import { SearchForm } from '../components/SearchForm'
import { FilterTabs } from '../components/FilterTabs'

interface Certification {
  id: number
  employee: string
  role: string
  certification: string
  issueDate: string
  expiryDate: string
  status: 'Active' | 'Expiring Soon' | 'Expired'
}

const initialCertifications: Certification[] = [
  {
    id: 1,
    employee: 'Jared Leto',
    role: 'Drill Operator',
    certification: 'Class A Rig Telemetry',
    issueDate: '2025-05-28',
    expiryDate: '2027-05-28',
    status: 'Active',
  },
  {
    id: 2,
    employee: 'Sarah Connor',
    role: 'Safety Inspector',
    certification: 'Advanced First Aid & Rescue',
    issueDate: '2025-05-26',
    expiryDate: '2026-06-26',
    status: 'Expiring Soon',
  },
  {
    id: 3,
    employee: 'Mark Ronson',
    role: 'Haul Dumper Pilot',
    certification: 'HD-785 Mechanical Induction',
    issueDate: '2025-05-25',
    expiryDate: '2026-06-25',
    status: 'Expiring Soon',
  },
  {
    id: 4,
    employee: 'Elena Rostova',
    role: 'Excavator Operator',
    certification: 'PC-2000 Operation & Maintenance',
    issueDate: '2025-05-22',
    expiryDate: '2027-05-22',
    status: 'Active',
  },
  {
    id: 5,
    employee: 'Peter Parker',
    role: 'Electrical Specialist',
    certification: 'High Voltage Site Isolation',
    issueDate: '2024-03-10',
    expiryDate: '2026-03-10',
    status: 'Expired',
  },
  {
    id: 6,
    employee: 'Bruce Wayne',
    role: 'Site Supervisor',
    certification: 'Mine Safety Act Compliance (MHSAC)',
    issueDate: '2025-01-15',
    expiryDate: '2028-01-15',
    status: 'Active',
  },
  {
    id: 7,
    employee: 'Diana Prince',
    role: 'Environmental Engineer',
    certification: 'Hazardous Dust Mitigation',
    issueDate: '2025-11-20',
    expiryDate: '2026-11-20',
    status: 'Active',
  },
  {
    id: 8,
    employee: 'Clark Kent',
    role: 'Heavy Equipment Mech',
    certification: 'Hydraulic Systems Diagnosis',
    issueDate: '2024-09-12',
    expiryDate: '2026-09-12',
    status: 'Active',
  },
]

export default async function CertificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = (await searchParams) ?? {}

  const filteredCerts = initialCertifications.filter((c) => {
    const matchesSearch =
      !q ||
      c.employee.toLowerCase().includes(q.toLowerCase()) ||
      c.certification.toLowerCase().includes(q.toLowerCase()) ||
      c.role.toLowerCase().includes(q.toLowerCase())
    const matchesFilter = !status || status === 'All' || c.status === status
    return matchesSearch && matchesFilter
  })

  const activeCount = initialCertifications.filter((c) => c.status === 'Active').length
  const expiringCount = initialCertifications.filter((c) => c.status === 'Expiring Soon').length
  const expiredCount = initialCertifications.filter((c) => c.status === 'Expired').length

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
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-arch-accent-charcoal text-[var(--bg-secondary)] text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-card">
          <Plus className="w-4 h-4" />
          <span>Issue Endorsement</span>
        </button>
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
            options={['All', 'Active', 'Expiring Soon', 'Expired']}
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
              {filteredCerts.length > 0 ? (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="py-3 font-medium text-arch-text-primary">{cert.employee}</td>
                    <td className="py-3 text-arch-text-muted">{cert.role}</td>
                    <td className="py-3 font-semibold text-arch-text-primary flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-arch-accent-charcoal" />
                      <span>{cert.certification}</span>
                    </td>
                    <td className="py-3 text-arch-text-muted">{cert.issueDate}</td>
                    <td className="py-3 text-arch-text-muted">{cert.expiryDate}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                          cert.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : cert.status === 'Expiring Soon'
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
