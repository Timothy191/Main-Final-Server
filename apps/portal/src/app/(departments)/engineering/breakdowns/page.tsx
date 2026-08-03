import { DepartmentSectionShell } from '@/components/departments/DepartmentSectionShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Engineering — Breakdowns | Arch OS',
  description: 'This section is ready for navigation.',
}

export default function Page() {
  return (
    <DepartmentSectionShell
      title="Engineering — Breakdowns"
      description="This section is ready for navigation."
    />
  )
}
