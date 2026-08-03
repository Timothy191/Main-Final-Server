import '@repo/ui/globals.css'
import { ArchThemeProvider } from '@repo/theme/react'
import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono, Outfit } from 'next/font/google'

import localFont from 'next/font/local'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import ClientProviders from './ClientProviders'
import { PerformanceListener } from '@/components/PerformanceListener'
import { RouteAnnouncer } from '@/components/RouteAnnouncer'
import { PWAInstallButton } from '@/components/PWAInstallButton'
import { SystemTrayPill } from '@/components/system/SystemTray'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'
import { ArchMacMenuBar } from '@/components/system/ArchMacMenuBar'
import { PartnerBrandStrip } from '@/components/system/PartnerBrandStrip'
import { ArchLockOverlay } from '@/components/system/ArchLockOverlay'
import { Toaster } from '@repo/ui/Toaster'
import { CookieConsent } from '@repo/ui/CookieConsent'
import { FeedbackWidget } from '@/components/FeedbackWidget'

const HeaderWidgets = dynamic(
  () =>
    import('@/components/HeaderWidgets').then((m) => ({
      default: m.HeaderWidgets,
    })),
  {
    loading: () => (
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="w-7 h-7 rounded-full bg-overlay-dim border border-arch-border-subtle animate-pulse" />
        <div className="w-20 h-7 rounded-full bg-overlay-dim border border-arch-border-subtle animate-pulse" />
        <div className="w-7 h-7 rounded-full bg-overlay-dim border border-arch-border-subtle animate-pulse" />
      </div>
    ),
  }
)

const CommandBar = dynamic(() =>
  import('@/components/CommandBar').then((m) => ({ default: m.CommandBar }))
)
import { SplitWindowLayout } from '@/components/system/SplitWindowLayout'
import { RouteBackground } from '@/components/RouteBackground'
import { ViewportBoundaries } from '@/components/system/ViewportBoundaries'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
  adjustFontFallback: true,
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
  adjustFontFallback: true,
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600'],
  display: 'swap',
  adjustFontFallback: true,
})

/** Display / brand stencil (Anurati) — logo/wordmark only via `font-display` utility. */
const anurati = localFont({
  src: '../../public/fonts/Anurati-Regular.otf',
  variable: '--font-display',
  display: 'swap',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Arch-Systems | Arch OS',
  description: 'Multi-departmental industrial operations portal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Arch Portal',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#f5f5f7',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal?: React.ReactNode
}): React.JSX.Element {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${robotoMono.variable} ${outfit.variable} ${anurati.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'}
        />
        <link
          rel="dns-prefetch"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'}
        />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  source: 'document',
                  where: {
                    and: [
                      {
                        href_matches: [
                          '/',
                          '/drilling/*',
                          '/production/*',
                          '/access-control/*',
                          '/engineering/*',
                          '/control-room/*',
                          '/safety/*',
                          '/training/*',
                          '/satellite-monitoring/*',
                          '/admin/*',
                        ],
                      },
                      { not: { href_matches: '/api/*' } },
                      { not: { href_matches: '/_next/*' } },
                    ],
                  },
                  eagerness: 'moderate',
                },
              ],
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="text-text-heading min-h-screen font-sans antialiased selection:bg-arch-accent-charcoal/30 selection:text-arch-accent-charcoal relative overflow-x-hidden bg-transparent"
      >
        {/* Skip navigation link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Announce SPA route changes to screen readers (WCAG 4.1.3) */}
        <Suspense fallback={null}>
          <RouteAnnouncer />
        </Suspense>

        <ArchThemeProvider>
          <ClientProviders>
            <Suspense fallback={null}>
              <RouteBackground />
            </Suspense>
            <PerformanceListener />
            <WebVitalsReporter />
            <PWAInstallButton />
            {/* Global Navigation Header with proper landmark */}
            <header role="banner" className="flex items-center gap-3">
              <ArchMacMenuBar
                leftSlot={<PartnerBrandStrip variant="taskbar" />}
                rightSlot={
                  <nav role="navigation" aria-label="Global">
                    <div className="flex items-center gap-2">
                      <FeedbackWidget />
                      <SystemTrayPill />
                      <HeaderWidgets />
                    </div>
                  </nav>
                }
              />
            </header>

            {/* Content wrapper with main landmark */}
            <main id="main-content" role="main" className="relative z-primary-card pt-16 font-sans">
              <SplitWindowLayout>{children}</SplitWindowLayout>
            </main>

            <CommandBar />
            <ArchLockOverlay />
            <ViewportBoundaries />
            <CookieConsent />
            <Toaster />
            {modal}
          </ClientProviders>
        </ArchThemeProvider>
      </body>
    </html>
  )
}
