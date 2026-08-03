'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@repo/supabase/client'

function safeNextPath(raw: string | null): string {
  if (!raw) return '/hub'
  try {
    const url = new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin) return '/hub'
    if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
      return '/hub'
    }
    return `${url.pathname}${url.search}`
  } catch {
    return '/hub'
  }
}

/**
 * OAuth PKCE callback — must run in the browser so the code verifier
 * stored during signInWithOAuth can complete the exchange.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Completing sign-in…')

  useEffect(() => {
    let cancelled = false

    async function finish() {
      const code = searchParams.get('code')
      const errorDescription = searchParams.get('error_description')
      const next = safeNextPath(searchParams.get('next') ?? searchParams.get('redirect'))

      if (errorDescription) {
        setMessage(errorDescription)
        return
      }

      if (!code) {
        setMessage('Missing authorization code.')
        return
      }

      try {
        const supabase = createBrowserSupabaseClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (error) {
          setMessage(error.message || 'Sign-in failed.')
          return
        }
        router.replace(next)
        router.refresh()
      } catch {
        if (!cancelled) setMessage('Could not complete sign-in.')
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <main className="min-h-[calc(100vh-28px)] flex items-center justify-center p-6">
      <p className="text-sm text-arch-text-secondary" role="status">
        {message}
      </p>
    </main>
  )
}
