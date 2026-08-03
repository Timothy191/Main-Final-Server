import { GlassCard } from '@repo/ui/GlassCard'
import { FileText, TrendingUp, ShieldAlert, CheckCircle, BarChart3 } from 'lucide-react'
import { ExportButton } from '../components/ExportButton'

interface Report {
  id: string
  name: string
  type: string
  generatedDate: string
  author: string
  size: string
}

const initialReports: Report[] = [
  {
    id: 'REP-0102',
    name: 'Q2 Core Equipment Licensing Compliance Audit',
    type: 'PDF Audit',
    generatedDate: '2026-05-30',
    author: 'Sarah Jenkins',
    size: '2.4 MB',
  },
  {
    id: 'REP-0099',
    name: 'Weekly Expiry Hazard Warning Report (June)',
    type: 'CSV Export',
    generatedDate: '2026-05-29',
    author: 'System Automated',
    size: '112 KB',
  },
  {
    id: 'REP-0094',
    name: 'LMS Progression & Backlog Summary (May 2026)',
    type: 'Excel Sheet',
    generatedDate: '2026-05-25',
    author: 'Sarah Jenkins',
    size: '1.8 MB',
  },
  {
    id: 'REP-0087',
    name: 'Underground Safety Ticket Re-certification Roster',
    type: 'PDF List',
    generatedDate: '2026-05-18',
    author: 'David Vance',
    size: '840 KB',
  },
]

const complianceRates = [
  { name: 'Drilling Department', rate: 98, trainees: 24, status: 'Optimal' },
  { name: 'Production Department', rate: 91, trainees: 64, status: 'Good' },
  {
    name: 'Engineering Department',
    rate: 94,
    trainees: 38,
    status: 'Optimal',
  },
  {
    name: 'Access Control / Security',
    rate: 100,
    trainees: 12,
    status: 'Optimal',
  },
  {
    name: 'Administration & Safety Staff',
    rate: 88,
    trainees: 15,
    status: 'Caution',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Training & LMS Audits</h2>
          <p className="text-arch-text-muted text-sm mt-0.5">
            Access training history, compliance audits, and legal certificate registry lists.
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance breakdown */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="font-semibold text-sm text-arch-text-primary">
                  Departmental Compliance Rates
                </h3>
                <p className="text-arch-text-muted text-[11px]">
                  Percentage of personnel with all active, non-expired credentials
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-arch-text-muted" />
            </div>

            <div className="mt-4 space-y-4">
              {complianceRates.map((dept, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-arch-text-secondary">{dept.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-arch-text-muted">
                        ({dept.trainees} active staff)
                      </span>
                      <span
                        className={`font-semibold ${
                          dept.rate >= 95
                            ? 'text-emerald-600'
                            : dept.rate >= 90
                              ? 'text-blue-600'
                              : 'text-amber-600 font-bold'
                        }`}
                      >
                        {dept.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-arch-surface-chrome h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${
                        dept.rate >= 95
                          ? 'bg-emerald-500'
                          : dept.rate >= 90
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Quick summary cards */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                  Overall Site Compliance
                </p>
                <p className="text-xl font-bold text-arch-text-primary">94.2%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                  Pending Expirations (15d)
                </p>
                <p className="text-xl font-bold text-arch-text-primary">5 Personnel</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                  LMS Course Completions MTD
                </p>
                <p className="text-xl font-bold text-arch-text-primary">118 modules</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Reports history */}
      <GlassCard>
        <div className="pb-3 border-b border-arch-border-default flex items-center justify-between">
          <h3 className="font-semibold text-sm text-arch-text-primary">
            Generated Audits & Exports
          </h3>
          <button className="text-xs px-2.5 py-1 bg-arch-surface-chrome border border-arch-border-default hover:bg-arch-surface-chrome-medium rounded-md font-semibold transition-colors">
            Generate Custom Report
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-default text-arch-text-muted font-semibold">
                <th className="pb-2">ID</th>
                <th className="pb-2">Report Name</th>
                <th className="pb-2">Format</th>
                <th className="pb-2">Generated At</th>
                <th className="pb-2">Compiler</th>
                <th className="pb-2 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {initialReports.map((report) => (
                <tr key={report.id} className="hover:bg-arch-surface-chrome">
                  <td className="py-3 font-semibold text-arch-text-muted">{report.id}</td>
                  <td className="py-3 font-medium text-arch-text-primary flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{report.name}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-arch-surface-chrome-medium font-medium text-arch-text-secondary">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-3 text-arch-text-muted">{report.generatedDate}</td>
                  <td className="py-3 text-arch-text-muted">{report.author}</td>
                  <td className="py-3 text-right">
                    <ExportButton />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
