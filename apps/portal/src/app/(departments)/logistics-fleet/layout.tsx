import { DepartmentLayout } from '@repo/ui/DepartmentLayout'
import { DEPARTMENTS, getDepartmentTabs } from '@/lib/departments'
import { notFound } from 'next/navigation'
import { ActiveDepartmentSetter } from '@/components/nav/ActiveDepartmentSetter'

export default async function LogisticsFleetLayout({ children }: { children: React.ReactNode }) {
  const dept = DEPARTMENTS.find((d) => d.name === 'logistics-fleet')
  if (!dept) notFound()

  const tabs = getDepartmentTabs('logistics-fleet')

  return (
    <>
      <ActiveDepartmentSetter department="logistics-fleet" />
      <DepartmentLayout department={dept} tabs={tabs}>
        {children}
      </DepartmentLayout>
    </>
  )
}
