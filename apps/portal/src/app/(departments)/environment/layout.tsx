import { DepartmentLayout } from '@repo/ui/DepartmentLayout'
import { DEPARTMENTS, getDepartmentTabs } from '@/lib/departments'
import { notFound } from 'next/navigation'
import { ActiveDepartmentSetter } from '@/components/nav/ActiveDepartmentSetter'

export default async function EnvironmentLayout({ children }: { children: React.ReactNode }) {
  const dept = DEPARTMENTS.find((d) => d.name === 'environment')
  if (!dept) notFound()

  const tabs = getDepartmentTabs('environment')

  return (
    <>
      <ActiveDepartmentSetter department="environment" />
      <DepartmentLayout department={dept} tabs={tabs}>
        {children}
      </DepartmentLayout>
    </>
  )
}
