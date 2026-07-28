import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'High-Res | Arch OS',
  description: 'High-resolution satellite imagery.',
}

export default function Page() {
  return (
    <DynamicTable
      title="High-Res"
      description="High-resolution satellite imagery."
      tableName="machines"
    />
  )
}
