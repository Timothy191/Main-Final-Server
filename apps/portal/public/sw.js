/**
 * Arch Systems Portal — Service Worker
 *
 * Cache-First strategies for static assets, Network-First for pages/API,
 * with offline fallback and background sync.
 *
 * Cache strategy:
 *   - Static assets (JS/CSS/fonts/images): Cache-First (immutable, content-hashed)
 *   - Navigations (HTML pages): Network-First (fresh content, cached fallback)
 *   - API GET requests: Network-First (fresh data, cached fallback)
 *   - Fonts (Google Fonts/local): Cache-First (rarely change)
 *   - Images from Supabase: Cache-First after first load
 *
 * Cache naming: arch-{type}-v{version} — increment version to force re-cache.
 */

const CACHE_NAMES = {
  STATIC: 'arch-static-v1',
  PAGES: 'arch-pages-v1',
  API: 'arch-api-v1',
  FONTS: 'arch-fonts-v1',
  IMAGES: 'arch-images-v1',
}

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/logo.svg',
  '/auth-bg-poster.jpg',
]

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAMES.STATIC)
    // Best-effort pre-cache; individual failures won't break install
    for (const url of STATIC_ASSETS) {
      try {
        await cache.add(url)
      } catch {
        // Asset may not exist yet at build time — skip silently
      }
    }
  })())
  // Take control immediately so the new SW starts serving on this page
  self.skipWaiting()
})

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    const validCaches = new Set(Object.values(CACHE_NAMES))

    await Promise.all(
      cacheNames
        .filter((name) => !validCaches.has(name))
        .map((name) => caches.delete(name))
    )

    // Start controlling all clients without reload
    await self.clients.claim()
  })())
})

// ── Fetch Strategies ───────────────────────────────────────────────────────────

/**
 * Cache-First: serve from cache if available, otherwise fetch and cache.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok && response.status < 400) {
      const cache = await caches.open(cacheName)
      // Don't cache opaque responses (e.g., CORS failures)
      if (response.type !== 'opaque') {
        cache.put(request, response.clone())
      }
    }
    return response
  } catch (error) {
    // Offline and not in cache — return fallback
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

/**
 * Network-First: try network, fall back to cache on failure.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok && response.status < 400) {
      const cache = await caches.open(cacheName)
      if (response.type !== 'opaque') {
        cache.put(request, response.clone())
      }
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // Navigation fallback — serve cached root page
    if (request.mode === 'navigate') {
      const root = await caches.match('/')
      if (root) return root
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

/**
 * Stale-While-Revalidate: serve cached immediately, fetch update in background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request)

  const fetchPromise = (async () => {
    try {
      const response = await fetch(request)
      if (response.ok && response.status < 400) {
        const cache = await caches.open(cacheName)
        if (response.type !== 'opaque') {
          cache.put(request, response.clone())
        }
      }
    } catch {
      // Network failed — cached version is fine
    }
  })()

  if (cached) {
    // Fire background refresh without blocking
    fetchPromise.catch(() => {})
    return cached
  }

  // No cache — wait for network
  return fetchPromise
}

// ── Fetch Handler ──────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Skip non-HTTP(S) requests (e.g., chrome-extension://)
  if (!url.protocol.startsWith('http')) return

  // Skip Supabase WebSocket connections
  if (url.protocol === 'wss:' || url.protocol === 'ws:') return

  // Skip Next.js dev server HMR & dynamic chunks from SW caching
  if (url.pathname.startsWith('/_next/')) {
    return
  }

  // ── Static assets (JS/CSS): Cache-First ────────────────────────────────
  if (/\.(js|css|map)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.STATIC))
    return
  }

  // ── API requests: Network-First ─────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    // Non-idempotent methods should never be cached by SW
    event.respondWith(networkFirst(request, CACHE_NAMES.API))
    return
  }

  // ── Navigation requests: Network-First ──────────────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAMES.PAGES))
    return
  }

  // ── Fonts: Cache-First ──────────────────────────────────────────────────
  if (/\.(woff2?|ttf|otf|eot)$/i.test(url.pathname) ||
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'fonts.googleapis.com') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.FONTS))
    return
  }

  // ── Images: Cache-First ─────────────────────────────────────────────────
  if (/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.IMAGES))
    return
  }

  // ── Next.js static (/_next/static): Cache-First ─────────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.STATIC))
    return
  }

  // ── Everything else: Network-First ──────────────────────────────────────
  event.respondWith(networkFirst(request, CACHE_NAMES.PAGES))
})

// ── Message Handler (for cache invalidation from app) ──────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return

  const { type, payload } = event.data

  switch (type) {
    case 'CLEAR_CACHE': {
      const cacheName = payload?.cacheName
      if (cacheName && Object.values(CACHE_NAMES).includes(cacheName)) {
        caches.delete(cacheName).then(() => {
          self.clients.get(event.source?.id).then((client) => {
            client?.postMessage({ type: 'CACHE_CLEARED', cacheName })
          })
        })
      } else {
        // Clear all caches
        Promise.all(Object.values(CACHE_NAMES).map((name) => caches.delete(name)))
      }
      break
    }
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    default:
      break
  }
})

// ── Background Sync (for offline mutations) ────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil((async () => {
      // Notify all clients to trigger their offline queue sync
      const clients = await self.clients.matchAll()
      clients.forEach((client) => {
        client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' })
      })
    })())
  }
})