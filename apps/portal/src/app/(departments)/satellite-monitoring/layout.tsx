import { DepartmentLayout } from '@repo/ui/DepartmentLayout'
import { DEPARTMENTS, getDepartmentTabs } from '@/lib/departments'
import { notFound } from 'next/navigation'
import { ActiveDepartmentSetter } from '@/components/nav/ActiveDepartmentSetter'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const dept = DEPARTMENTS.find((d) => d.name === 'satellite-monitoring')
  if (!dept) notFound()

  const tabs = getDepartmentTabs('satellite-monitoring')

  return (
    <>
      <ActiveDepartmentSetter department="satellite-monitoring" />
      <DepartmentLayout department={dept} tabs={tabs}>
        {children}
      </DepartmentLayout>
    </>
  )
}
