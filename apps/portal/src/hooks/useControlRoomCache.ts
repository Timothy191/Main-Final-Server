'use client'
// apps/portal/src/hooks/useControlRoomCache.ts

import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseControlRoomCacheOptions {
  ttlSeconds?: number
  tags?: string[]
  /**
   * Auto-resume delay in milliseconds. When a fetch throws, the hook schedules a
   * background retry after this delay so the data source can recover on its own.
   * Defaults to 10_000 ms. Set to 0 to disable the automatic retry.
   */
  retryDelayMs?: number
}

// Default auto-resume delay (10 seconds) when a fetch errors.
const DEFAULT_RETRY_DELAY_MS = 10_000

interface CacheEntry<T> {
  data: T
  expiresAt: number
  tags: string[]
}

// Global client-side in-memory cache store
const clientCacheStore = new Map<string, CacheEntry<unknown>>()

/**
 * Client Cache Invalidation by Tags
 * Evicts keys from the client-side in-memory cache store that match any of the provided tags.
 */
export function invalidateClientCacheByTags(tags: string[]): void {
  const tagSet = new Set(tags)
  for (const [key, entry] of clientCacheStore.entries()) {
    if (entry.tags.some((t) => tagSet.has(t))) {
      clientCacheStore.delete(key)
    }
  }
}

/**
 * useControlRoomCache hook
 *
 * Client-side caching hook to store, serve, and refresh telemetry/dashboard data.
 * Protects against infinite re-rendering loops by wrapping volatile fetcher and options parameters in useRef.
 */
export function useControlRoomCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseControlRoomCacheOptions
) {
  const [data, setData] = useState<T | null>(() => {
    const entry = clientCacheStore.get(key)
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data as T
    }
    return null
  })
  const [error, setError] = useState<Error | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Keep references to fetcher and options to avoid infinite loops when unstable references are passed
  const fetcherRef = useRef(fetcher)
  const optionsRef = useRef(options)

  // Holds the pending auto-resume retry timer so it can be cleared on unmount or
  // superseded by a newer attempt (prevents stacked retries).
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const executeFetch = useCallback(
    async (force = false) => {
      // Cancel any pending auto-resume retry since a fresh attempt is beginning;
      // this prevents retries from stacking up.
      clearRetry()
      setIsValidating(true)
      setError(null)
      try {
        if (!force) {
          const cached = clientCacheStore.get(key)
          if (cached && Date.now() < cached.expiresAt) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setData(cached.data as any)
            setIsValidating(false)
            return
          }
        }

        const freshData = await fetcherRef.current()

        const ttl = optionsRef.current?.ttlSeconds ?? 15
        const tags = optionsRef.current?.tags ?? []
        const expiresAt = Date.now() + ttl * 1000

        clientCacheStore.set(key, {
          data: freshData,
          expiresAt,
          tags,
        })

        setData(freshData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))

        // Auto-resume: schedule a background retry after the configured delay
        // (default 10s) so the hook recovers on its own without an infinite
        // render loop. A later successful/intervening attempt cancels it.
        const retryDelayMs = optionsRef.current?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
        if (retryDelayMs > 0) {
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null
            void executeFetch(false)
          }, retryDelayMs)
        }
      } finally {
        setIsValidating(false)
      }
    },
    [key, clearRetry]
  )

  const refresh = useCallback(() => {
    return executeFetch(true)
  }, [executeFetch])

  useEffect(() => {
    const cached = clientCacheStore.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setData(cached.data as any)
    } else {
      executeFetch(false)
    }
    return clearRetry
  }, [key, executeFetch, clearRetry])

  return {
    data,
    error,
    isValidating,
    refresh,
  }
}

// Export the cache store for testing access if required
export { clientCacheStore as _clientCacheStoreForTesting }
