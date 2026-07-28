import { BottomNav } from '@/components/nav/BottomNav'
import { createServerSupabaseClient, getUserSafely } from '@repo/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { resolveAccessibleDepartmentNames } from '@/lib/accessible-departments'
import { isDeptAllowedForRole } from '@/lib/dept-access'

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const user = await getUserSafely(supabase)

  if (!user || !user.id) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const cookieList = cookieStore.getAll()

  // AGENT-TRACE: Same ACL ∩ role gate as hub cards so Control nav cannot bypass role deny.
  const { names, role } = await resolveAccessibleDepartmentNames(user.id, cookieList)
  const accessibleDepartments = names.filter((name) => isDeptAllowedForRole(name, role))

  return (
    <div className="min-h-[calc(100vh-28px)] text-arch-text-primary">
      <div className="relative z-10">
        <div>
          <main className="w-full px-4 pt-0 pb-6 sm:px-8 sm:pt-0 sm:pb-8 pb-20 md:pb-8 -mt-4">
            {children}
          </main>
        </div>

        <BottomNav accessibleDepartments={accessibleDepartments} />
      </div>
    </div>
  )
}
