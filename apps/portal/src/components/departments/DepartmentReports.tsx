import { createServerSupabaseClient } from '@repo/supabase/server'
import { GlassCard } from '@repo/ui/GlassCard'
import { FileText } from 'lucide-react'

/**
 * Shared "Generated Audits & Exports" list for department Reports tabs.
 * Reads from the `generated_reports` table (RLS is department-scoped).
 */
export async function DepartmentReports({
  deptId,
  limit = 15,
}: {
  deptId: string
  limit?: number
}) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('generated_reports')
    .select('id, report_type, report_date, report_data, pdf_url')
    .eq('department_id', deptId)
    .order('report_date', { ascending: false })
    .limit(limit)

  const reports = (data ?? []) as {
    id: string
    report_type: string | null
    report_date: string
    report_data: { name?: string } | null
    pdf_url: string | null
  }[]

  return (
    <GlassCard>
      <div className="pb-3 border-b border-arch-border-default flex items-center justify-between">
        <h3 className="font-semibold text-sm text-arch-text-primary">Generated Audits & Exports</h3>
      </div>

      {error ? (
        <p className="py-6 text-center text-sm text-arch-text-muted">
          Failed to load reports: {error.message}
        </p>
      ) : reports.length === 0 ? (
        <p className="py-10 text-center text-sm text-arch-text-muted">
          No reports generated for this department yet.
        </p>
      ) : (
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
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-arch-surface-chrome">
                  <td className="py-3 font-semibold text-arch-text-muted">
                    {report.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="py-3 font-medium text-arch-text-primary flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {report.report_data?.name ??
                        (report.report_type ? `Report (${report.report_type})` : 'Report')}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-arch-surface-chrome-medium font-medium text-arch-text-secondary">
                      {report.report_type ?? 'Report'}
                    </span>
                  </td>
                  <td className="py-3 text-arch-text-muted">{report.report_date}</td>
                  <td className="py-3 text-right">
                    {report.pdf_url ? (
                      <a
                        href={report.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-arch-accent-charcoal hover:underline font-semibold"
                      >
                        <FileText className="w-3 h-3" />
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-arch-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  )
}
