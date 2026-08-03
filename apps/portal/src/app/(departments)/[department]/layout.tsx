import { DepartmentLayout } from '@repo/ui/DepartmentLayout'
import { DEPARTMENTS, getDepartmentTabs } from '@/lib/departments'
import { notFound } from 'next/navigation'
import { ActiveDepartmentSetter } from '@/components/nav/ActiveDepartmentSetter'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ department: string }>
}): Promise<Metadata> {
  const { department } = await params
  const dept = DEPARTMENTS.find((d) => d.name === department)
  return {
    title: dept ? `${dept.displayName} | Arch OS` : 'Department | Arch OS',
  }
}

export default async function DepartmentRootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ department: string }>
}) {
  const { department } = await params
  const dept = DEPARTMENTS.find((d) => d.name === department)
  if (!dept) notFound()

  const tabs = getDepartmentTabs(department)

  return (
    <>
      <ActiveDepartmentSetter department={department} />
      <DepartmentLayout department={dept} tabs={tabs}>
        {children}
      </DepartmentLayout>
    </>
  )
}
