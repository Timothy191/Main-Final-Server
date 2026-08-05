import { redirect } from 'next/navigation'

export default async function GeologyDashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  // If pointing to a Supabase Cloud instance, redirect to its cloud dashboard project console
  if (supabaseUrl.includes('.supabase.co')) {
    try {
      const hostname = new URL(supabaseUrl).hostname
      const projectRef = hostname.split('.')[0]
      if (projectRef) {
        redirect(`https://supabase.com/dashboard/project/${projectRef}`)
      }
    } catch {
      // Fall through to local fallback if URL parsing fails
    }
  }

  // Local development fallback to local Supabase Studio dashboard
  redirect('http://localhost:54323')
}
