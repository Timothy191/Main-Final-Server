import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Log | Arch OS',
  description: 'Safety daily logs and incidents.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Daily Log"
      description="Safety daily logs and incidents."
      tableName="safety_incidents"
    />
  )
}
