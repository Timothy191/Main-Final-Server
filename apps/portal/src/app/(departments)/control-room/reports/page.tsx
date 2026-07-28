import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports | Arch OS',
  description: 'Control room reports.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Reports"
      description="Control room reports."
      tableName="generated_reports"
    />
  )
}
