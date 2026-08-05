import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getUserSafely } from '@repo/supabase/server'
import { AdminTabsClient } from '@/features/admin/components/AdminTabsClient'
import { UsersTab } from '@/features/admin/tabs/UsersTab'
import { DepartmentsTab } from '@/features/admin/tabs/DepartmentsTab'
import { OperatorsTab } from '@/features/admin/tabs/OperatorsTab'
import { SitesTab } from '@/features/admin/tabs/SitesTab'
import { DelayCategoriesTab } from '@/features/admin/tabs/DelayCategoriesTab'
import { MachinesTab } from '@/features/admin/tabs/MachinesTab'
import { ScrollText } from 'lucide-react'

const TABS = ['users', 'departments', 'operators', 'sites', 'delay-categories', 'machines']

// AGENT-TRACE: Operators / Sites / Delay Categories / Machines are reference
// data owned and managed only from the Admin department (consumed read-only by
// department UIs like Control Room).
const TAB_LABELS: Record<string, string> = {
  users: 'Users',
  departments: 'Departments',
  operators: 'Operators',
  sites: 'Sites',
  'delay-categories': 'Delay Categories',
  machines: 'Machines',
}

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
          <div className="flex flex-wrap gap-1 mb-6 border-b border-arch-border-default">
            {TABS.map((t) => (
              <Link
                key={t}
                href={`?tab=${t}`}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === t
                    ? 'text-arch-text-primary border-b-2 border-arch-accent-blue -mb-px'
                    : 'text-arch-text-muted hover:text-arch-text-secondary'
                }`}
              >
                {TAB_LABELS[t]}
              </Link>
            ))}
          </div>

          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'departments' && <DepartmentsTab />}
          {activeTab === 'operators' && <OperatorsTab />}
          {activeTab === 'sites' && <SitesTab />}
          {activeTab === 'delay-categories' && <DelayCategoriesTab />}
          {activeTab === 'machines' && <MachinesTab />}
        </AdminTabsClient>
      </main>
    </div>
  )
}
