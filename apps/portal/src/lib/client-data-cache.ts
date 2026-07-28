/**
 * Client-Side Data Cache — IndexedDB-backed with TTL + tag-based invalidation.
 *
 * Mirrors the server-side @repo/redis cache on the client, enabling:
 *   - Instant repeat data loads (0ms from IndexedDB vs network)
 *   - Offline data access for previously fetched data
 *   - Tag-based invalidation coordinated with server cache tags
 *   - Stale-while-revalidate pattern for always-fresh data
 *
 * Usage:
 *   import { clientCacheGet, clientCacheSet, clientCacheInvalidateTags } from '@/lib/client-data-cache'
 *
 *   // Cache API response for 5 minutes
 *   const data = await clientCacheGet('hub:counts')
 *   if (!data) {
 *     const fresh = await fetch('/api/hub/counts').then(r => r.json())
 *     await clientCacheSet('hub:counts', fresh, 300_000, ['hub', 'dept:metadata'])
 *   }
 *
 * Cache invalidation from service worker:
 *   navigator.serviceWorker.controller?.postMessage({
 *     type: 'CLEAR_CACHE',
 *     payload: { cacheName: 'arch-api-v1' }
 *   })
 */

'use client'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClientCacheEntry<T> {
  key: string
  data: T
  tags: string[]
  expiresAt: number
  createdAt: number
}

export interface ClientCacheStats {
  size: number
  expiredCount: number
  oldestEntry: number | null
  newestEntry: number | null
}

/* ------------------------------------------------------------------ */
/*  IndexedDB Setup                                                    */
/* ------------------------------------------------------------------ */

const DB_NAME = 'arch-client-cache'
const DB_VERSION = 1
const STORE_NAME = 'cache'

let dbPromise: Promise<IDBDatabase> | null = null
let dbCache: IDBDatabase | null = null

/**
 * Reset the cached DB connection. Useful for testing.
 */
export function _resetClientCacheDB(): void {
  if (dbCache) {
    try { dbCache.close() } catch { /* ignore */ }
  }
  dbCache = null
  dbPromise = null
}

function openDB(): Promise<IDBDatabase> {
  if (dbCache) return Promise.resolve(dbCache)
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('tags', 'tags', { multiEntry: true })
        store.createIndex('expiresAt', 'expiresAt', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = () => {
      dbCache = request.result
      dbCache.onclose = () => { dbCache = null; dbPromise = null }
      dbCache.onversionchange = () => { dbCache?.close(); dbCache = null; dbPromise = null }
      resolve(request.result)
    }

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

/* ------------------------------------------------------------------ */
/*  Core Cache Operations                                              */
/* ------------------------------------------------------------------ */

/**
 * Retrieve a cached entry by key.
 * Returns null if the entry doesn't exist or has expired.
 * Expired entries are lazily deleted.
 */
export async function clientCacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    const entry = await new Promise<ClientCacheEntry<T> | undefined>((resolve, reject) => {
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result as ClientCacheEntry<T> | undefined)
      req.onerror = () => reject(req.error)
    })

    if (!entry) return null

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      // Lazy delete in background
      clientCacheDelete(key).catch(() => {})
      return null
    }

    return entry.data
  } catch {
    // Graceful degradation — return null on any error
    return null
  }
}

/**
 * Store a value in the client cache with TTL and optional tags.
 *
 * @param key - Cache key (should match server-side cache key for consistency)
 * @param data - The data to cache (must be JSON-serializable)
 * @param ttlMs - Time-to-live in milliseconds
 * @param tags - Optional tags for group invalidation
 */
export async function clientCacheSet<T>(
  key: string,
  data: T,
  ttlMs: number,
  tags: string[] = []
): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const entry: ClientCacheEntry<T> = {
      key,
      data,
      tags,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    }

    store.put(entry)

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Silent fail — cache is best-effort
  }
}

/**
 * Delete a single entry from the client cache.
 */
export async function clientCacheDelete(key: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(key)
  } catch {
    // Silent fail
  }
}

/**
 * Invalidate all cache entries associated with the given tags.
 * This mirrors the server-side cacheInvalidateTags() for coordinated invalidation.
 */
export async function clientCacheInvalidateTags(tags: string[]): Promise<void> {
  if (tags.length === 0) return

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('tags')

    const keysToDelete = new Set<string>()

    for (const tag of tags) {
      const range = IDBKeyRange.only(tag)
      const cursorReq = index.openCursor(range)

      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (cursor) {
            keysToDelete.add(cursor.value.key)
            cursor.continue()
          } else {
            resolve()
          }
        }
        cursorReq.onerror = () => reject(cursorReq.error)
      })
    }

    // Delete all matched entries
    for (const key of keysToDelete) {
      store.delete(key)
    }
  } catch {
    // Silent fail
  }
}

/**
 * Clear all entries from the client cache.
 */
export async function clientCacheClear(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.clear()
  } catch {
    // Silent fail
  }
}

/* ------------------------------------------------------------------ */
/*  Cache Statistics & Maintenance                                     */
/* ------------------------------------------------------------------ */

/**
 * Get cache statistics (size, expired count, etc.)
 */
export async function clientCacheGetStats(): Promise<ClientCacheStats> {
  const stats: ClientCacheStats = {
    size: 0,
    expiredCount: 0,
    oldestEntry: null,
    newestEntry: null,
  }

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('createdAt')

    const allEntries = await new Promise<ClientCacheEntry<unknown>[]>((resolve, reject) => {
      const req = index.getAll()
      req.onsuccess = () => resolve(req.result as ClientCacheEntry<unknown>[])
      req.onerror = () => reject(req.error)
    })

    stats.size = allEntries.length
    const now = Date.now()

    for (const entry of allEntries) {
      if (now > entry.expiresAt) {
        stats.expiredCount++
      }
      if (stats.oldestEntry === null || entry.createdAt < stats.oldestEntry) {
        stats.oldestEntry = entry.createdAt
      }
      if (stats.newestEntry === null || entry.createdAt > stats.newestEntry) {
        stats.newestEntry = entry.createdAt
      }
    }

    return stats
  } catch {
    return stats
  }
}

/**
 * Remove all expired entries from the cache.
 * Call periodically (e.g., every 60s) to prevent stale data accumulation.
 */
export async function clientCachePurgeExpired(): Promise<number> {
  let purged = 0

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('expiresAt')
    const range = IDBKeyRange.upperBound(Date.now())

    const cursorReq = index.openCursor(range)

    await new Promise<void>((resolve, reject) => {
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (cursor) {
          cursor.delete()
          purged++
          cursor.continue()
        } else {
          resolve()
        }
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })
  } catch {
    // Silent fail
  }

  return purged
}

/**
 * Start periodic cache cleanup. Returns a cleanup function.
 * Call on app startup (e.g., in ClientProviders).
 *
 * @param intervalMs - How often to purge expired entries (default: 60s)
 */
export function startClientCacheCleanup(intervalMs = 60_000): () => void {
  const interval = setInterval(() => {
    clientCachePurgeExpired().catch(() => {})
  }, intervalMs)

  return () => clearInterval(interval)
}

/* ------------------------------------------------------------------ */
/*  Cache Warming — Pre-fetch common data after page load              */
/* ------------------------------------------------------------------ */

interface WarmTarget {
  key: string
  url: string
  ttlMs: number
  tags: string[]
}

const WARM_TARGETS: WarmTarget[] = [
  { key: 'hub:counts', url: '/api/hub/counts', ttlMs: 300_000, tags: ['hub'] },
  { key: 'hub:alerts', url: '/api/hub/alerts', ttlMs: 60_000, tags: ['hub'] },
  { key: 'hub:production-trend', url: '/api/hub/production-trend', ttlMs: 300_000, tags: ['hub'] },
]

/**
 * Warm the client cache by pre-fetching common data in the background.
 * Uses requestIdleCallback to avoid impacting critical rendering.
 */
export function warmClientCache(): void {
  if (typeof window === 'undefined') return

  const warm = () => {
    for (const target of WARM_TARGETS) {
      fetch(target.url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => clientCacheSet(target.key, data, target.ttlMs, target.tags))
        .catch(() => {
          // Silent fail — warming is best-effort
        })
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(warm, { timeout: 5000 })
  } else {
    // Fallback: warm after a short delay
    setTimeout(warm, 2000)
  }
}