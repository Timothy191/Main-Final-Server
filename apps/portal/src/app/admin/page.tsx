import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getUserSafely } from '@repo/supabase/server'
import { AdminTabsClient } from '@/features/admin/components/AdminTabsClient'
import { UsersTab } from '@/features/admin/tabs/UsersTab'
import { DepartmentsTab } from '@/features/admin/tabs/DepartmentsTab'
import { ScrollText } from 'lucide-react'

const TABS = ['users', 'departments']

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const user = await getUserSafely(supabase)

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin') {
    redirect('/hub')
  }

  const { tab: rawTab } = await searchParams
  const activeTab = typeof rawTab === 'string' && TABS.includes(rawTab) ? rawTab : 'users'

  return (
    <div className="min-h-screen bg-arch-surface-primary text-arch-text-primary">
      <header className="sticky top-0 z-50 border-b border-arch-border-default bg-arch-surface-primary/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-lg font-medium text-arch-text-primary">Admin Dashboard</span>
          <Link
            href="/admin/audit-trail"
            className="inline-flex items-center gap-2 text-sm text-arch-text-muted hover:text-arch-text-primary transition-colors"
          >
            <ScrollText className="w-4 h-4" />
            Audit Trail
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <AdminTabsClient activeTab={activeTab}>
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'departments' && <DepartmentsTab />}
        </AdminTabsClient>
      </main>
    </div>
  )
}
