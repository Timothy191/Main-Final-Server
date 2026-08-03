import { GlassCard } from '@repo/ui/GlassCard'
import { FileText, TrendingUp, ShieldAlert, CheckCircle } from 'lucide-react'
import { ExportButton } from '../components/ExportButton'
import { getTrainingMetrics, getTrainingReports } from '../actions'
import { getDepartmentContext } from '@/lib/dept-context'

export default async function ReportsPage() {
  const { deptId } = await getDepartmentContext({ department: 'training' })

  const [metrics, reports] = await Promise.all([
    getTrainingMetrics(deptId),
    getTrainingReports(deptId, 15),
  ])

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

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-[11px] font-semibold uppercase tracking-wider">
                Overall LMS Compliance
              </p>
              <p className="text-xl font-bold text-arch-text-primary">
                {metrics.lmsCompliance.toFixed(1)}%
              </p>
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
                Pending Expirations (30d)
              </p>
              <p className="text-xl font-bold text-arch-text-primary">
                {metrics.expiringCertifications} Personnel
              </p>
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
                Course Catalog
              </p>
              <p className="text-xl font-bold text-arch-text-primary">
                {metrics.totalCourses} modules
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Reports history */}
      <GlassCard>
        <div className="pb-3 border-b border-arch-border-default flex items-center justify-between">
          <h3 className="font-semibold text-sm text-arch-text-primary">
            Generated Audits & Exports
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-default text-arch-text-muted font-semibold">
                <th className="pb-2">ID</th>
                <th className="pb-2">Report Name</th>
                <th className="pb-2">Format</th>
                <th className="pb-2">Generated At</th>
                <th className="pb-2 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-arch-surface-chrome">
                    <td className="py-3 font-semibold text-arch-text-muted">
                      {report.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 font-medium text-arch-text-primary flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{report.name}</span>
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-arch-surface-chrome-medium font-medium text-arch-text-secondary">
                        {report.reportType ?? 'Report'}
                      </span>
                    </td>
                    <td className="py-3 text-arch-text-muted">{report.reportDate}</td>
                    <td className="py-3 text-right">
                      {report.pdfUrl ? (
                        <a
                          href={report.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-arch-accent-charcoal hover:underline font-semibold"
                        >
                          <FileText className="w-3 h-3" />
                          Open
                        </a>
                      ) : (
                        <ExportButton />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-arch-text-muted">
                    No training audit reports generated yet.
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
