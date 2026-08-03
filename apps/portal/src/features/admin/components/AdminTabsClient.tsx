'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AdminTabs } from './AdminTabs'

interface AdminTabsClientProps {
  activeTab: string
  children: React.ReactNode
}

export function AdminTabsClient({ activeTab, children }: AdminTabsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <AdminTabs value={activeTab} onValueChange={handleValueChange}>
      {children}
    </AdminTabs>
  )
}
