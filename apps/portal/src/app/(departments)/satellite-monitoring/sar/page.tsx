import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SAR | Arch OS',
  description: 'Synthetic Aperture Radar data.',
}

export default function Page() {
  return (
    <DynamicTable
      title="SAR"
      description="Synthetic Aperture Radar data."
      tableName="machines"
    />
  )
}
