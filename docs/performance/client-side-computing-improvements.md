# Client-Side Computing Improvements

**Date:** 2026-07-28  
**Status:** Analysis complete — P0 items implemented  
**Focus:** Client-side caching, offline capability, and performance optimization

---

## Executive Summary

The portal already has solid **server-side caching** (Redis L1/L2 mesh, `"use cache"` directive, tag-based invalidation) and some **client-side foundations** (PWA manifest, offline mutation queue, speculation rules). However, the **client-side caching layer was incomplete** — the service worker (`/sw.js`) referenced in code didn't exist, there was no cache-first strategy for pages/assets, and no client-side data cache.

**P0 items have been implemented in this batch.** This document maps out all improvements ranked by impact.

---

## Current State Assessment

| Area | Status | Details |
|------|--------|---------|
| **Service Worker** | ✅ **Implemented** | `public/sw.js` with cache-first strategies, offline fallback, background sync |
| **Client Data Cache** | ✅ **Implemented** | `src/lib/client-data-cache.ts` — IndexedDB-backed with TTL + tag invalidation |
| **PWA Manifest** | ✅ Complete | Icons, shortcuts, standalone display, scope |
| **PWA Install Prompt** | ✅ Complete | `PWAInstallButton.tsx` handles `beforeinstallprompt` |
| **Speculation Rules (Prerender)** | ✅ Present | Prerenders department pages with `eagerness: 'moderate'` |
| **Offline Mutation Queue** | ✅ Complete | IndexedDB-backed queue in `useOfflineQueue.ts` |
| **Adaptive Performance** | ✅ Complete | FPS monitoring, `.low-perf-fallback` class |
| **Web Vitals** | ✅ Complete | LCP, CLS, FCP, TTFB, INP tracking |
| **Server Cache (Redis)** | ✅ Complete | L1/L2 mesh, tag invalidation, request coalescing |
| **DNS Prefetch** | ✅ Present | Supabase URL prefetch in layout |
| **Font Display Swap** | ✅ Complete | All fonts use `display: swap` |
| **Client Page Cache** | ✅ **Implemented** | Service worker caches pages with network-first strategy |
| **Client Data Cache** | ✅ **Implemented** | IndexedDB-backed with TTL + tag-based invalidation |
| **Cache Warming** | ✅ **Implemented** | `warmClientCache()` pre-fetches common data after page load |
| **Link Prefetching** | ⚠️ Partial | Next.js `router.prefetch()` not systematically used |
| **App Shell** | ⚠️ Partial | Service worker caches shell assets, but no dedicated shell architecture |
| **Image Caching** | ⚠️ Partial | Next.js Image component with `minimumCacheTTL: 86400` |

---

## Improvement 1: Service Worker with Cache-First Strategy ✅ IMPLEMENTED

**File:** `apps/portal/public/sw.js`

### Cache Strategies

| Cache Name | Strategy | What It Caches | Rationale |
|------------|----------|----------------|-----------|
| `arch-static-v1` | **Cache-First** | JS/CSS bundles, fonts, images, icons | These never change between builds (content-hashed) |
| `arch-pages-v1` | **Network-First** | HTML pages (/, /control-room, etc.) | Always show fresh content, fall back to cached |
| `arch-api-v1` | **Network-First** | API responses (GET only) | Fresh data preferred, cached as fallback |
| `arch-fonts-v1` | **Cache-First** | Google Fonts, local fonts | Fonts are static assets |
| `arch-images-v1` | **Cache-First** | Supabase images, avatars | Images change rarely, cache aggressively |

### Key Behaviors

1. **On install:** Pre-cache critical static assets (app shell JS/CSS, logo, fonts)
2. **On activate:** Clean up old caches from previous versions
3. **On fetch:** Route requests to appropriate cache strategy
4. **On message:** Listen for cache invalidation commands from the app
5. **Background sync:** Retry failed mutations when online

### Expected Impact
- **Repeat visit load time:** ~80% faster (cached JS/CSS/fonts)
- **Offline capability:** Full offline for previously visited pages
- **Back/forward navigation:** Instant (cached pages)
- **Data usage:** Reduced on repeat visits

---

## Improvement 2: Client-Side Data Cache with IndexedDB ✅ IMPLEMENTED

**File:** `apps/portal/src/lib/client-data-cache.ts`

### Architecture

```
[Browser]
  ├── Service Worker (HTTP cache) — caches full responses
  └── IndexedDB Data Cache — caches parsed JSON data with TTL + tags
        ├── Department metadata (TTL: 24h)
        ├── Hub dashboard data (TTL: 5min)
        ├── User preferences (TTL: 1h)
        └── API responses (TTL: configurable per endpoint)
```

### API

| Function | Purpose |
|----------|---------|
| `clientCacheGet<T>(key)` | Retrieve cached data by key |
| `clientCacheSet<T>(key, data, ttlMs, tags)` | Store data with TTL + tags |
| `clientCacheDelete(key)` | Delete a single entry |
| `clientCacheInvalidateTags(tags)` | Invalidate all entries with matching tags |
| `clientCacheClear()` | Clear all cached data |
| `clientCacheGetStats()` | Get cache statistics |
| `clientCachePurgeExpired()` | Remove expired entries |
| `startClientCacheCleanup(intervalMs)` | Periodic cleanup of expired entries |
| `warmClientCache()` | Pre-fetch common data after page load |

### Expected Impact
- **API response time:** 0ms (from IndexedDB) vs 50-500ms (network)
- **Offline data access:** Previously fetched data available offline
- **Reduced server load:** Fewer requests hit the server

---

## Improvement 3: Intelligent Link Prefetching (P1 — NOT YET IMPLEMENTED)

**Problem:** Speculation rules prerender all department pages with `eagerness: 'moderate'`, which is aggressive and may waste bandwidth. There's no prioritization based on user behavior.

**Solution:** Implement a tiered prefetching strategy:

| Tier | Trigger | What | Eagerness |
|------|---------|------|-----------|
| **Tier 1** | User hovers a link | That specific page | `immediate` |
| **Tier 2** | User is on a department page | Sibling departments | `moderate` |
| **Tier 3** | Idle time detected | Most-visited pages | `conservative` |

### Expected Impact
- **Page transition time:** ~50% faster (prefetched pages)
- **Bandwidth:** More efficient than prerendering everything

---

## Improvement 4: App Shell Architecture (P1 — NOT YET IMPLEMENTED)

**Problem:** On repeat visits, the browser still downloads the full page HTML, including the shell (header, navigation, sidebar) which rarely changes.

**Solution:** The service worker already handles this partially via cache-first for JS/CSS and network-first for pages. To optimize further:

1. Add a `Cache-Control: public, max-age=0, stale-while-revalidate=86400` header for HTML pages
2. The service worker serves cached HTML immediately, then updates in background
3. Next.js RSC streaming fills in the dynamic content

### Expected Impact
- **Time-to-interactive:** ~60% faster on repeat visits
- **Perceived performance:** Content appears instantly from cache

---

## Improvement 5: Optimistic UI with Client-Side State (P1 — NOT YET IMPLEMENTED)

**Problem:** Every user action (navigation, data load) shows a loading state while waiting for the server.

**Solution:** Use the client data cache to show cached/optimistic data immediately, then update from server.

### Expected Impact
- **Perceived load time:** Instant (cached data shown immediately)
- **User experience:** No loading spinners for previously viewed data
- **Resilience:** Works offline for cached data

---

## Improvement 6: Background Cache Warming ✅ IMPLEMENTED

**File:** `apps/portal/src/lib/client-data-cache.ts` (function `warmClientCache()`)

After the page loads, prefetch and cache data for likely next pages in the background using `requestIdleCallback`.

### Expected Impact
- **Second-page load:** ~40% faster (data pre-cached)
- **User experience:** Subsequent navigations feel instant

---

## Improvement 7: Optimized Image Loading (P2 — NOT YET IMPLEMENTED)

**Problem:** Background videos and large images are loaded on every page visit.

**Solution:** 
1. Add `fetchpriority="high"` / `fetchpriority="low"` to prioritize critical images
2. Use `loading="lazy"` for below-fold images
3. Preload critical background images in the `<head>`

### Expected Impact
- **LCP improvement:** ~10-20% for pages with hero images
- **Bandwidth:** Reduced for non-critical images

---

## Improvement 8: Client-Side Route Transition Cache (P2 — NOT YET IMPLEMENTED)

**Problem:** When navigating between department pages, the entire page re-renders.

**Solution:** Use Next.js `layout` to persist the shell and only swap the content area. Combined with the service worker cache, this makes navigation instant.

### Expected Impact
- **Navigation smoothness:** No flash of loading state
- **State preservation:** Scroll position, sidebar state preserved

---

## Implementation Priority Matrix

| Improvement | Impact | Effort | Priority | Status |
|-------------|--------|--------|----------|--------|
| **1. Service Worker** | High | Medium | **P0** | ✅ Done |
| **2. Client Data Cache** | High | Medium | **P0** | ✅ Done |
| **3. Intelligent Prefetch** | Medium | Low | **P1** | ⬜ Pending |
| **4. App Shell** | Medium | Low | **P1** | ⬜ Pending |
| **5. Optimistic UI** | Medium | Medium | **P1** | ⬜ Pending |
| **6. Cache Warming** | Low | Low | **P2** | ✅ Done |
| **7. Image Optimization** | Low | Low | **P2** | ⬜ Pending |
| **8. Route Transition Cache** | Low | Low | **P2** | ⬜ Pending |

---

## Production Test Suite ✅ IMPLEMENTED

**File:** `scripts/production-test-suite.sh`

A comprehensive test suite that validates the full stack end-to-end:

| Phase | What It Tests | Layer |
|-------|---------------|-------|
| Phase 1 | Environment & Configuration | Portal UI |
| Phase 2 | Portal Routes & Rendering | Portal UI |
| Phase 3 | Health Endpoints & Infrastructure | All layers |
| Phase 4 | Server Cache Layer (Redis) | Server Cache |
| Phase 5 | Client Cache Layer (SW + IndexedDB) | Client Cache |
| Phase 6 | Database Layer (Supabase) | Database |
| Phase 7 | End-to-End Data Flow | Full pipeline |
| Phase 8 | Performance & Response Times | All layers |

**Usage:**
```bash
pnpm production-test                    # Test localhost:3000
pnpm production-test:url -- https://portal.example.com
pnpm production-test:strict             # Fail on warnings too
pnpm production-test:json               # Machine-readable output
pnpm production-test:ci                 # CI mode (strict + JSON)
```

---

## Key Metrics to Track

| Metric | Current (estimated) | Target | How to Measure |
|--------|---------------------|--------|----------------|
| Repeat visit load time | ~2-3s | <500ms | Web Vitals (LCP) |
| Offline capability | None | Full offline for visited pages | Manual test |
| Back/forward navigation | ~500ms | Instant (<50ms) | `pageswap` event |
| API response time (repeat) | ~100ms | 0ms (from cache) | `useCachedData` metrics |
| Data usage (repeat visit) | ~2MB | <200KB | DevTools Network tab |
| Time-to-interactive | ~1.5s | <800ms | Web Vitals (TTI) |

---

## Summary

The **P0 improvements have been implemented** in this batch:

1. **Service Worker** (`public/sw.js`) — the single biggest gap. The code already registered it, but the file didn't exist. Now it has cache-first strategies for static assets, network-first for pages/API, offline fallback, and background sync.

2. **Client Data Cache** (`src/lib/client-data-cache.ts`) — mirrors the server-side Redis cache on the client using IndexedDB. API responses are cached with TTL and tag-based invalidation, making repeat data fetches instant and enabling offline data access.

3. **Cache Warming** — pre-fetches common data after page load using `requestIdleCallback`.

4. **Production Test Suite** (`scripts/production-test-suite.sh`) — validates the full stack from Portal UI through Redis cache to Supabase database, including service worker and client cache verification.

These improvements transform the portal from a "works online" app to a "works instantly, works offline" app, which is especially valuable for mining operations where connectivity may be intermittent.