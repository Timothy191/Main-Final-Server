'use client'

import { useEffect, type ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import dynamic from 'next/dynamic'

const SmoothScrollProvider = dynamic(
  () => import('@/components/SmoothScrollProvider').then((mod) => mod.SmoothScrollProvider),
  { ssr: false }
) as React.FC<{ children: ReactNode }>

export default function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
      // Unregister service workers in development to avoid cache conflicts
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          Promise.all(registrations.map((r) => r.unregister())).then((results) => {
            if (results.some(Boolean)) {
              Sentry.logger.warn('Unregistered stale service workers in dev mode', {
                registration_count: results.filter(Boolean).length,
              })
              window.location.reload()
            }
          })
        }
      })
    } else if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      // Register service worker in production
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((_registration) => {
            // Service worker registered silently
          })
          .catch((registrationError) => {
            Sentry.logger.error('Service worker registration failed', {
              error_message:
                registrationError instanceof Error
                  ? registrationError.message
                  : String(registrationError),
            })
          })
      })
    }

    // Initialize offline queue sync listeners
    import('@/hooks/useOfflineQueue').then((mod) => {
      mod.initOfflineQueueListeners()
    })

    // Initialize client-side data cache (IndexedDB-backed)
    import('@/lib/client-data-cache').then((mod) => {
      // Start periodic cleanup of expired entries
      const stopCleanup = mod.startClientCacheCleanup(60_000)
      // Warm cache with common data after page load
      mod.warmClientCache()
      // Store cleanup reference for potential teardown
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>).__clientCacheCleanup = stopCleanup
      }
    })
  }, [])

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>
}
