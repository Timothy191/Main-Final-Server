'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@repo/supabase/client'
import { Input } from '@repo/ui/Input'
import { AnimatedButton } from '@repo/ui/AnimatedButton'
import { Lock, Check, AlertTriangle, Loader2 } from 'lucide-react'

/**
 * Maps raw Supabase user profile update errors to precise, readable user instructions.
 * Resolves password validation issues such as weak password complexity or using the current password.
 *
 * @param raw - The raw error message string from the user update process.
 * @returns A safe, human-readable error description.
 */
function mapUpdateError(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('weak')) {
    return 'Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.'
  }
  if (lower.includes('same')) {
    return 'New password must be different from your current password.'
  }
  return 'Unable to update password. Please try again.'
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [error, setError] = useState('')
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(({ data }) => {
      setCheckingSession(false)
      setHasSession(!!data.session)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const supabase = createBrowserSupabaseClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (updateError) {
      setError(mapUpdateError(updateError.message))
      return
    }

    setUpdated(true)
    redirectTimeoutRef.current = setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  if (checkingSession) {
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="glass-card rounded-xl overflow-hidden p-6 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-arch-accent-charcoal animate-spin mx-auto" />
          <p className="text-sm text-arch-text-muted">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="glass-card rounded-xl overflow-hidden p-6 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-arch-accent-red mx-auto" strokeWidth={1.5} />
          <h1 className="text-lg font-medium text-arch-text-primary">Link Expired</h1>
          <p className="text-sm text-arch-text-muted">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/reset-password"
            className="inline-block w-full text-center px-4 py-2.5 rounded-full bg-arch-accent-charcoal text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="glass-card rounded-xl overflow-hidden animate-window-open glass-top-border">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-[var(--glass-surface-hover)]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-arch-border-subtle" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-arch-border-subtle" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-arch-border-subtle" />
          </div>
          <span className="flex-1 text-center text-[13px] font-medium text-arch-text-secondary select-none pr-14">
            Arch — New Password
          </span>
        </div>

        <div className="p-6 space-y-4">
          {updated ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-arch-accent-green/10 mx-auto">
                <Check className="w-6 h-6 text-arch-accent-green" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-medium text-arch-text-primary">Password Updated</h1>
                <p className="text-sm text-arch-text-muted">
                  Your password has been updated. Redirecting to sign in...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-arch-accent-charcoal/10 mx-auto">
                <Lock className="w-6 h-6 text-arch-accent-charcoal" strokeWidth={1.5} />
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-xl font-medium text-arch-text-primary">Set New Password</h1>
                <p className="text-sm text-arch-text-muted">
                  Choose a strong password you have not used before.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm text-arch-text-secondary">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="login"
                    className="liquid-glass-input focus:ring-0"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    aria-describedby={error ? 'update-error' : undefined}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm text-arch-text-secondary"
                  >
                    Confirm Password
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    variant="login"
                    className="liquid-glass-input focus:ring-0"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    aria-describedby={error ? 'update-error' : undefined}
                  />
                </div>

                {error && (
                  <p
                    id="update-error"
                    className="text-sm text-red-700 bg-red-50/80 px-3 py-2 rounded-md flex items-center gap-2"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    {error}
                  </p>
                )}

                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="w-full liquid-glass-button"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </AnimatedButton>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
