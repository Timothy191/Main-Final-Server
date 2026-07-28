import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Engineering Notes | Arch OS',
  description: 'Engineering notes.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Engineering Notes"
      description="Engineering notes."
      tableName="engineering_notes"
    />
  )
}
