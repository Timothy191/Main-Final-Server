import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machine Operations | Arch OS',
  description: 'Live machine operations.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Machine Operations"
      description="Live machine operations."
      tableName="machine_operations"
    />
  )
}
