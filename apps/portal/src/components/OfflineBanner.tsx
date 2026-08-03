'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

type BannerState = 'hidden' | 'offline' | 'syncing' | 'back-online'

export function OfflineBanner() {
  const [state, setState] = useState<BannerState>('hidden')
  const [queueCount, setQueueCount] = useState(0)

  useEffect(() => {
    // Set initial state
    if (!navigator.onLine) {
      setState('offline')
    }

    const handleOffline = () => {
      setState('offline')
    }

    const handleOnline = async () => {
      setState('syncing')

      // Give the sync queue time to flush before showing success
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setState('back-online')

      // Auto-dismiss after 3 seconds
      setTimeout(() => setState('hidden'), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Poll IndexedDB queue count while offline
  useEffect(() => {
    if (state !== 'offline') return

    const pollQueue = async () => {
      try {
        const dbRequest = indexedDB.open('ArchSyncDB', 1)
        dbRequest.onsuccess = () => {
          const db = dbRequest.result
          if (!db.objectStoreNames.contains('actionQueue')) return
          const tx = db.transaction('actionQueue', 'readonly')
          const store = tx.objectStore('actionQueue')
          const index = store.index('status')
          const req = index.count(IDBKeyRange.only('pending'))
          req.onsuccess = () => setQueueCount(req.result ?? 0)
        }
      } catch {
        // IndexedDB unavailable — ignore
      }
    }

    pollQueue()
    const interval = setInterval(pollQueue, 5000)
    return () => clearInterval(interval)
  }, [state])

  if (state === 'hidden') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300',
        state === 'offline' && 'bg-arch-accent-blue/95 text-white',
        state === 'syncing' && 'bg-arch-accent-blue/95 text-white',
        state === 'back-online' && 'bg-arch-accent-green/95 text-white'
      )}
    >
      {state === 'offline' && (
        <>
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>
            Offline mode — changes are queued locally
            {queueCount > 0 && <span className="ml-1 font-semibold">({queueCount} pending)</span>}
          </span>
        </>
      )}
      {state === 'syncing' && (
        <>
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          <span>Back online — syncing queued changes…</span>
        </>
      )}
      {state === 'back-online' && (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>All changes synced successfully</span>
        </>
      )}
    </div>
  )
}
