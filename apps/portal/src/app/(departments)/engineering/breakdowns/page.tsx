import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Breakdowns | Arch OS',
  description: 'Machine breakdowns.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Breakdowns"
      description="Machine breakdowns."
      tableName="breakdowns"
    />
  )
}
