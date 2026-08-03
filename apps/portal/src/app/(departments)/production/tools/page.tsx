import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tools | Arch OS',
  description: 'Production tools.',
}

export default function Page() {
  return <DynamicTable title="Tools" description="Production tools." tableName="equipment" />
}
