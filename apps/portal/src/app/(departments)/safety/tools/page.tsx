import { DepartmentSectionShell } from '@/components/departments/DepartmentSectionShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Safety — Tools | Arch OS',
  description: 'This section is ready for navigation.',
}

export default function Page() {
  return (
    <DepartmentSectionShell
      title="Safety — Tools"
      description="This section is ready for navigation."
    />
  )
}
