import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports | Arch OS',
  description: 'Production reports.',
}

export default function Page() {
  return (
    <DynamicTable title="Reports" description="Production reports." tableName="generated_reports" />
  )
}
