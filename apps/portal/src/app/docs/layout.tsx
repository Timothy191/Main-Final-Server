import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@repo/supabase/server'

// AGENT-TRACE: Layout for documentation routes - enforces auth protection
// Only accessible to authenticated users with admin or engineering roles
// Redirects unauthorized users to login

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  // Allow admin and engineering roles to access docs
  const allowedRoles = new Set(['admin', 'engineering'])
  if (!employee || !allowedRoles.has(employee.role)) {
    redirect('/')
  }

  return <>{children}</>
}
