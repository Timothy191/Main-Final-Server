'use client'

import { useEffect, type ReactNode } from 'react'
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
              console.warn(
                '[sw] Unregistered stale service worker(s) in development mode. Reloading...'
              )
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
            console.error('SW registration failed: ', registrationError)
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
