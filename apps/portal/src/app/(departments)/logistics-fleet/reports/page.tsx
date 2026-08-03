import { getDepartmentContext } from '@/lib/dept-context'
import { DepartmentReports } from '@/components/departments/DepartmentReports'

export default async function LogisticsFleetReportsPage() {
  const { deptId } = await getDepartmentContext({ department: 'logistics-fleet' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Logistics & Fleet Reports</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Fleet utilisation, fuel consumption and maintenance exports
        </p>
      </div>

      <DepartmentReports deptId={deptId} />
    </div>
  )
}
