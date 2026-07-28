import { redirect } from 'next/navigation'

export default function RootPage() {
  // /login is the primary landing page for the application
  redirect('/login')
}

