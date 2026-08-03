import { getDepartmentContext } from '@/lib/dept-context'
import { DepartmentReports } from '@/components/departments/DepartmentReports'

export default async function EnvironmentReportsPage() {
  const { deptId } = await getDepartmentContext({ department: 'environment' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Environmental Reports</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Compliance audits, exceedance logs and monitoring exports
        </p>
      </div>

      <DepartmentReports deptId={deptId} />
    </div>
  )
}
