import { DepartmentSectionShell } from '@/components/departments/DepartmentSectionShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machine Operations | Arch OS',
  description: 'This section is ready for navigation.',
}

export default function Page() {
  return (
    <DepartmentSectionShell
      title="Machine Operations"
      description="This section is ready for navigation."
    />
  )
}
