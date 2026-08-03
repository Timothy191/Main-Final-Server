import { DepartmentLayout } from '@repo/ui/DepartmentLayout'
import { DEPARTMENTS, getDepartmentTabs } from '@/lib/departments'
import { notFound } from 'next/navigation'
import { ActiveDepartmentSetter } from '@/components/nav/ActiveDepartmentSetter'

export default async function GeologyLayout({ children }: { children: React.ReactNode }) {
  const dept = DEPARTMENTS.find((d) => d.name === 'geology')
  if (!dept) notFound()

  const tabs = getDepartmentTabs('geology')

  return (
    <>
      <ActiveDepartmentSetter department="geology" />
      <DepartmentLayout department={dept} tabs={tabs}>
        {children}
      </DepartmentLayout>
    </>
  )
}
