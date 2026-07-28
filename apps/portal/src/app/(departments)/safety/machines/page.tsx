import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machines | Arch OS',
  description: 'Safety machines.',
}

export default function Page() {
  return (
    <DynamicTable
      title="Machines"
      description="Safety machines."
      tableName="machines"
    />
  )
}
