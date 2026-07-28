import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History | Arch OS',
  description: 'Historical safety incidents.',
}

export default function Page() {
  return (
    <DynamicTable
      title="History"
      description="Historical safety incidents."
      tableName="safety_incidents"
    />
  )
}
