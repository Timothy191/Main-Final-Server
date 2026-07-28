import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports | Arch OS',
  description: 'Access control reports.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Reports"
      description="Access control reports."
      tableName="generated_reports"
    />
  )
}
