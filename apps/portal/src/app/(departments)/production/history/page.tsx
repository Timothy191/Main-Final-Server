import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History | Arch OS',
  description: 'Historical production logs.',
}

export default function Page() {
  return (
    <DynamicTable
      title="History"
      description="Historical production logs."
      tableName="daily_logs"
    />
  )
}
