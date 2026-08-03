import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient, getUserSafely } from '@repo/supabase/server'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { LoginBrandBanner } from '@/features/auth/components/LoginBrandBanner'
import { LoginEveNotice } from '@/features/auth/components/LoginEveNotice'
import { LoginSecureBadge } from '@/features/auth/components/LoginSecureBadge'
import { AlertTriangle } from 'lucide-react'
import { Logo } from '@repo/ui/Logo'

export const metadata: Metadata = {
  title: 'Sign In | Arch OS',
  description: 'Sign in to Arch Systems',
}

export default async function LoginPage() {
  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  let systemUnavailable = false

  if (hasAuthCookie) {
    const supabase = await createServerSupabaseClient()
    try {
      await getUserSafely(supabase)
    } catch (e) {
      // Only mark as unavailable for auth service failures, not transient errors
      if (
        e instanceof Error &&
        (e.message.includes('AuthRetryableFetchError') ||
          e.message.includes('fetch failed') ||
          e.message.includes('network'))
      ) {
        // Transient — don't show unavailable, just serve the form

        console.warn('Transient auth check failure, serving login form:', e.message)
      } else {
        systemUnavailable = true
      }
    }
  }

  return (
    <div className="login-card-viewport relative w-full flex flex-col items-center justify-center pb-16 pt-4 px-4 sm:px-8 md:px-12 lg:px-20 overflow-y-auto">
      {/* Login Card wrapper — centered between taskbar and dock */}
      <div className="login-card-shell relative z-10 w-full my-auto os-shell-enter-2 flex flex-col justify-center">
        {systemUnavailable ? (
          <div className="os-shell os-shell--login w-full overflow-hidden">
            <div className="login-card-chrome-x flex items-center gap-3 py-3 border-b border-border-subtle login-chrome-band">
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-mac-red border border-border-subtle opacity-40" />
                <span className="w-3 h-3 rounded-full bg-mac-yellow border border-border-subtle opacity-40" />
                <span className="w-3 h-3 rounded-full bg-mac-green border border-border-subtle opacity-40" />
              </div>
              <span className="flex-1 text-center login-muted-text text-[13px] font-medium tracking-wide select-none">
                Arch — System Sign In
              </span>
            </div>
            <div className="login-card-body space-y-4 text-center">
              <AlertTriangle className="w-8 h-8 text-accent-red mx-auto" strokeWidth={1.5} />
              <h1 className="login-text-emphasis text-lg font-medium">System Unavailable</h1>
              <p className="login-muted-text text-sm">
                Unable to reach authentication services. Please try again shortly or contact IT
                Support.
              </p>
              <Link
                href="/login"
                className="login-cta inline-block mt-4 px-4 py-2 text-sm font-medium focus-visible:outline-none"
              >
                Retry
              </Link>
            </div>
          </div>
        ) : (
          <div
            data-testid="login-card"
            className="os-shell os-shell--login login-card-min-height w-full flex flex-col overflow-hidden login-card-container"
          >
            {/* Title bar */}
            <div className="login-card-chrome-x flex items-center gap-3 py-3 border-b border-border-subtle login-chrome-band">
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-mac-red border border-border-subtle opacity-40" />
                <span className="w-3 h-3 rounded-full bg-mac-yellow border border-border-subtle opacity-40" />
                <span className="w-3 h-3 rounded-full bg-mac-green border border-border-subtle opacity-40" />
              </div>
              <span className="flex-1 text-center login-muted-text text-[13px] font-medium tracking-wide select-none">
                Arch — System Sign In
              </span>
              <LoginSecureBadge />
            </div>

            <div className="login-card-body flex-1 flex flex-col justify-start space-y-6">
              {/* Title */}
              <div className="flex items-center gap-4">
                <div className="login-brand-mark relative shrink-0" aria-hidden="true">
                  <span className="login-brand-neon" />
                  <div className="login-brand-fold">
                    <span className="login-brand-fold__face login-brand-fold__face--left">
                      <Logo
                        variant="display"
                        stencilId="login-left"
                        className="login-brand-logo text-text-heading"
                      />
                    </span>
                    <span className="login-brand-fold__face login-brand-fold__face--right">
                      <Logo
                        variant="display"
                        stencilId="login-right"
                        className="login-brand-logo text-text-heading"
                      />
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="login-wordmark font-display text-3xl font-normal tracking-[0.12em] uppercase">
                    ARCH-SYSTEM
                  </h1>
                  <p className="login-muted-text text-[13px] font-medium tracking-wide">
                    Sign in to Arch Systems
                  </p>
                </div>
              </div>

              <LoginForm />

              <LoginEveNotice />
            </div>

            {/* Brand logo marquee */}
            <div className="login-card-chrome-x border-t border-border-subtle login-chrome-band select-none py-3">
              <LoginBrandBanner />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
