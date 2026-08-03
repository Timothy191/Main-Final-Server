import { DynamicTable } from '@/components/departments/DynamicTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Machines | Arch OS',
  description: 'Production machines.',
}

export default function Page() {
  return <DynamicTable title="Machines" description="Production machines." tableName="machines" />
}
