import { createServerSupabaseClient } from '@repo/supabase/server'
import { getDepartmentContext } from '@/lib/dept-context'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ReportsView } from './ReportsView'

export const metadata: Metadata = {
  title: 'Reports | Control Room | Arch OS',
  description: 'View and download generated control room shift reports.',
}

interface GeneratedReportRow {
  id: string
  generated_at: string
  pdf_url: string | null
  report_date: string
  shift_type: string | null
  report_data: Record<string, string | number | boolean | null | undefined>
  creator: { full_name: string } | { full_name: string }[] | null
  template: { name: string } | { name: string }[] | null
}

export default async function ReportsPage() {
  const { deptId } = await getDepartmentContext({ department: 'control-room' })
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch generated reports for this department
  const { data: reports, error } = await supabase
    .from('generated_reports')
    .select(
      `
      id,
      generated_at,
      pdf_url,
      report_date,
      shift_type,
      report_data,
      creator:employees!generated_reports_generated_by_fkey(full_name),
      template:report_templates!generated_reports_template_id_fkey(name)
    `
    )
    .eq('department_id', deptId)
    .order('report_date', { ascending: false })
    .order('generated_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to load generated reports: ${error.message}`)
  }

  const typedReports = (reports || []) as unknown as GeneratedReportRow[]

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">Shift & Performance Reports</h2>
        <p className="text-arch-text-muted text-sm">
          Access compiled production records, shift summaries, and SCADA system diagnostic reports.
        </p>
      </div>

      {/* Render Client Component */}
      <ReportsView reports={typedReports} />
    </div>
  )
}
