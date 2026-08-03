import { DepartmentSectionShell } from '@/components/departments/DepartmentSectionShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Personnel | Arch OS',
  description: 'Personnel management.',
}

export default function Page() {
  return <DepartmentSectionShell title="Personnel" description="Personnel management." />
}
