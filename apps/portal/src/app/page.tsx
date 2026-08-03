import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect authenticated users to the hub (main dashboard)
  // Unauthenticated users will be caught by middleware and redirected to /login
  redirect('/hub')
}
