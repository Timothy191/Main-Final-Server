import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machines | Arch OS',
  description: 'All machines under engineering.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Machines"
      description="All machines under engineering."
      tableName="machines"
    />
  )
}
