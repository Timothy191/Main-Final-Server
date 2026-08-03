import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getUserSafely } from '@repo/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  return children
}
