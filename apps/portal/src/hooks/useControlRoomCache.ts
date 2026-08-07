'use client'
// apps/portal/src/hooks/useControlRoomCache.ts

import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseControlRoomCacheOptions {
  ttlSeconds?: number
  tags?: string[]
}

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

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const executeFetch = useCallback(
    async (force = false) => {
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
      } finally {
        setIsValidating(false)
      }
    },
    [key]
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
  }, [key, executeFetch])

  return {
    data,
    error,
    isValidating,
    refresh,
  }
}

// Export the cache store for testing access if required
export { clientCacheStore as _clientCacheStoreForTesting }
