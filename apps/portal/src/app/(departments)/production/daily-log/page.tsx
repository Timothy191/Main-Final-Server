import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Log | Arch OS',
  description: 'Production daily logs.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Daily Log"
      description="Production daily logs."
      tableName="production_logs"
    />
  )
}
