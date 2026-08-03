import { getDepartmentContext } from '@/lib/dept-context'
import { DepartmentReports } from '@/components/departments/DepartmentReports'

export default async function GeologyReportsPage() {
  const { deptId } = await getDepartmentContext({ department: 'geology' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Geology & Survey Reports</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Survey reconciliations, grade control reports and block model exports
        </p>
      </div>

      <DepartmentReports deptId={deptId} />
    </div>
  )
}
