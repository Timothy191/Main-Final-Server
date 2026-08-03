import { DepartmentSectionShell } from '@/components/departments/DepartmentSectionShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shifts | Arch OS',
  description: 'Shift oversight and quotas.',
}

export default function Page() {
  return <DepartmentSectionShell title="Shifts" description="Shift oversight and quotas." />
}
