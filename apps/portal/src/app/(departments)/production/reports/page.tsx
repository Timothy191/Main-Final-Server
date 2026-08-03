import { DepartmentSectionShell } from '@/components/departments/DepartmentSectionShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Production — Reports | Arch OS',
  description: 'This section is ready for navigation.',
}

export default function Page() {
  return (
    <DepartmentSectionShell
      title="Production — Reports"
      description="This section is ready for navigation."
    />
  )
}
