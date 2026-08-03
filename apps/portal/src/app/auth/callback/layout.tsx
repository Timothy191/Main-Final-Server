import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Signing in | Arch OS',
  description: 'Completing secure sign-in',
}

interface AuthCallbackLayoutProps {
  children: React.ReactNode
}

/** Suspense boundary required for useSearchParams in the client page. */
export default function AuthCallbackLayout({ children }: AuthCallbackLayoutProps) {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-arch-text-secondary">Completing sign-in…</p>}
    >
      {children}
    </Suspense>
  )
}
