import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Excavator Activity | Arch OS',
  description: 'Live excavator tracking.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Excavator Activity"
      description="Live excavator tracking."
      tableName="excavator_activity"
    />
  )
}
