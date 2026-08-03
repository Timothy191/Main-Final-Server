'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Input } from '@repo/ui/Input'
import { AnimatedButton } from '@repo/ui/AnimatedButton'
import { createBrowserSupabaseClient } from '@repo/supabase/client'

const REMEMBER_KEY = 'arch-login-remember-email'

type OAuthProvider = 'google' | 'azure' | 'github'

interface LoginFormProps {
  /** Optional className on the root form */
  className?: string
}

const LOGIN_MUTED_TEXT = 'login-muted-text text-[13px] font-medium tracking-wide'

export function LoginForm({ className }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const [capsLockOn, setCapsLockOn] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        setEmail(saved)
        setRememberMe(true)
      }
    } catch {
      /* ignore storage errors */
    }
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          try {
            if (rememberMe) {
              window.localStorage.setItem(REMEMBER_KEY, email)
            } else {
              window.localStorage.removeItem(REMEMBER_KEY)
            }
          } catch {
            /* ignore */
          }

          const redirectParam = searchParams.get('redirect')
          let redirectPath = '/hub'

          if (redirectParam) {
            try {
              const url = new URL(redirectParam, window.location.origin)
              if (url.origin === window.location.origin) {
                if (
                  !/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.pathname)
                ) {
                  redirectPath = url.pathname
                }
              }
            } catch {
              // Invalid URL, use default
            }
          }

          router.push(redirectPath)
          router.refresh()
        } else {
          const { error } = await response.json()
          toast.error(error || 'Sign in failed')
        }
      } catch {
        toast.error('Network error. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, rememberMe, router, searchParams]
  )

  const handleOAuth = useCallback(async (provider: OAuthProvider) => {
    setOauthLoading(provider)
    try {
      const supabase = createBrowserSupabaseClient()
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      })
      if (error) {
        toast.error(error.message || `Could not start ${provider} sign-in`)
        setOauthLoading(null)
      }
      // On success the browser navigates away to the IdP
    } catch {
      toast.error('Could not start social sign-in. Please try again.')
      setOauthLoading(null)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'))
  }, [])

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'))
  }, [])

  const busy = isLoading || oauthLoading !== null

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="login-form"
      className={className ?? 'flex w-full flex-col space-y-4'}
    >
      <div className="w-full min-w-0 space-y-2">
        <label htmlFor="login-email" className="login-field-label">
          Employee ID or Email
        </label>
        <Input
          id="login-email"
          type="text"
          name="email"
          variant="login"
          autoComplete="username"
          placeholder="Enter your ID or email…"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
        />
      </div>

      <div className="w-full min-w-0 space-y-2">
        <label htmlFor="login-password" className="login-field-label">
          Password
        </label>
        <div className="relative w-full min-w-0">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            variant="login"
            autoComplete="current-password"
            placeholder="Enter your password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            required
            disabled={busy}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 login-muted-text hover:text-arch-text-primary focus-visible:outline-none rounded p-0.5"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {capsLockOn && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 text-accent-amber text-xs">
              <AlertCircle size={12} />
              <span>Caps Lock is on</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full min-w-0 items-center justify-between gap-3 pt-0.5">
        <label
          htmlFor="remember-me"
          className={`flex items-center gap-2 ${LOGIN_MUTED_TEXT} cursor-pointer select-none`}
        >
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={busy}
            className="login-checkbox h-3.5 w-3.5 shrink-0"
          />
          Remember me
        </label>
        <Link
          href="/reset-password"
          className={`${LOGIN_MUTED_TEXT} hover:text-arch-text-primary hover:underline focus-visible:outline-none rounded px-0.5`}
        >
          Forgot password?
        </Link>
      </div>

      <AnimatedButton
        type="submit"
        disabled={busy}
        className="login-cta inline-flex h-11 w-full min-w-0 max-w-full items-center justify-center px-4 text-[14px] font-semibold focus-visible:outline-none disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </AnimatedButton>

      <div className="flex items-center gap-3 py-1" role="separator">
        <div className="h-px flex-1 bg-border-subtle" aria-hidden="true" />
        <span className={`shrink-0 ${LOGIN_MUTED_TEXT}`}>or continue with</span>
        <div className="h-px flex-1 bg-border-subtle" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Social sign-in">
        <OAuthButton
          label="Google"
          provider="google"
          loading={oauthLoading === 'google'}
          disabled={busy}
          onClick={() => handleOAuth('google')}
        >
          <GoogleIcon />
        </OAuthButton>
        <OAuthButton
          label="Microsoft"
          provider="azure"
          loading={oauthLoading === 'azure'}
          disabled={busy}
          onClick={() => handleOAuth('azure')}
        >
          <MicrosoftIcon />
        </OAuthButton>
        <OAuthButton
          label="GitHub"
          provider="github"
          loading={oauthLoading === 'github'}
          disabled={busy}
          onClick={() => handleOAuth('github')}
        >
          <GitHubIcon />
        </OAuthButton>
      </div>
    </form>
  )
}

interface OAuthButtonProps {
  label: string
  provider: OAuthProvider
  loading: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}

function OAuthButton({ label, loading, disabled, onClick, children }: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Sign in with ${label}`}
      className={`login-oauth flex items-center justify-center gap-1.5 h-11 ${LOGIN_MUTED_TEXT} disabled:opacity-50 focus-visible:outline-none`}
    >
      {children}
      <span className="hidden sm:inline">{loading ? '…' : label}</span>
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.8 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 1.5 2.7 1.1.1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
    </svg>
  )
}
