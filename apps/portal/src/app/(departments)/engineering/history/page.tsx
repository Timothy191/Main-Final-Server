import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History | Arch OS',
  description: 'Historical engineering notes.',
}

export default function Page() {
  return (
    <DynamicTable
      title="History"
      description="Historical engineering notes."
      tableName="engineering_notes"
    />
  )
}
