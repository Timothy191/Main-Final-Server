import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tools | Arch OS',
  description: 'Safety tools.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Tools"
      description="Safety tools."
      tableName="equipment"
    />
  )
}
