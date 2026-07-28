import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tools | Arch OS',
  description: 'Engineering tools and equipment.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Tools"
      description="Engineering tools and equipment."
      tableName="equipment"
    />
  )
}
