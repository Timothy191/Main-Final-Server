import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hyperspectral | Arch OS',
  description: 'Hyperspectral satellite data.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Hyperspectral"
      description="Hyperspectral satellite data."
      tableName="machines"
    />
  )
}
