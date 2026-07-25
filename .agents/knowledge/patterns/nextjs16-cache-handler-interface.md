---
title: Next.js 16 CacheHandler interface (custom `cacheHandlers.default`)
tags: [patterns, caching, nextjs16, redis, gotcha]
updated: 2026-07-25
source_agent: qoder-cli
status: active
---

# Next.js 16 CacheHandler interface (custom `cacheHandlers.default`)

## Problem

Custom `cacheHandlers` wired via `next.config.mjs` **must** export a plain
object matching Next 16's `CacheHandler` shape. Exporting a class produces
a runtime error the first time a route with `"use cache"` renders:

```
TypeError: cacheHandler.get is not a function
```

The failure mode is easy to miss because unit tests that instantiate the
class directly still pass — they simply do not exercise Next's loader.

## Root cause

Next 16 loads the handler here (evidence: `next@16.2.10`
`dist/server/lib/cache-handlers/` and `dist/server/next-server.js`):

```
loadCustomCacheHandlers() {
  ...
  setCacheHandler(kind, interopDefault(await dynamicImportEsmDefault(...)))
}
```

`interopDefault` returns the module's default export **as-is** and Next
calls its methods directly (`cacheHandler.get(...)`). A class default
export therefore hits `Class.get(...)`, which is undefined because the
methods live on the prototype.

## Interface (verbatim from `next/dist/server/lib/cache-handlers/types.d.ts`)

```ts
export interface CacheHandler {
  get(cacheKey: string, softTags: string[]): Promise<undefined | CacheEntry>
  set(cacheKey: string, pendingEntry: Promise<CacheEntry>): Promise<void>
  refreshTags(): Promise<void>
  getExpiration(tags: string[]): Promise<Timestamp>
  updateTags(tags: string[], durations?: { expire?: number }): Promise<void>
}

export interface CacheEntry {
  value: ReadableStream<Uint8Array>
  tags: string[]
  stale: number       // seconds
  timestamp: number   // ms since epoch
  expire: number      // seconds
  revalidate: number  // seconds
}
```

Notable contract points:

- `set` receives a **Promise** of `CacheEntry` — the pending stream may
  still be writing. Await it before persisting, and drop the entry if the
  stream errors or is partial.
- `get` takes a `softTags` array; if any is stale, return `undefined`.
- `getExpiration` returns the **maximum** revalidate timestamp for a tag
  set, or `0` when never revalidated, or `Infinity` to defer to `get`.
- `refreshTags` may run once per request; keep it cheap.

## Solution

Export a factory-produced object:

```ts
function createRedisCacheHandler(): CacheHandler {
  return {
    async get(key, softTags) { /* ... */ },
    async set(key, pendingEntry) { /* ... */ },
    async refreshTags() { /* ... */ },
    async getExpiration(tags) { /* ... */ },
    async updateTags(tags, durations) { /* ... */ },
  }
}

export default createRedisCacheHandler()
```

Do **not** export a class. Do **not** implement only `get`/`set` — Next
calls all five.

## Evidence & Citation

- **Loader:** `node_modules/.pnpm/next@16.2.10*/node_modules/next/dist/server/next-server.js`
  around `loadCustomCacheHandlers()` (line ~580–590 in 16.2.10).
- **Interface:** `.../next/dist/server/lib/cache-handlers/types.d.ts`.
- **Reference implementation:** `.../next/dist/server/lib/cache-handlers/default.js`
  (`createDefaultCacheHandler`) — canonical shape to copy.
- **Failure surfaced on:** `apps/portal/src/app/hub/page.tsx` (uses
  `"use cache"` blocks), 2026-07-25.
- **Broken implementation (disabled):** `apps/portal/src/lib/next-cache-handler.ts`.
- **Disable point:** `apps/portal/next.config.mjs` — `cacheHandlers.default`
  commented out with a DISABLED note.
- **Followup spec:** `.kiro/specs/redis-cache-handler/` (local, gitignored).

## Related

- `.agents/knowledge/patterns/nextjs16-caching.md` — how to keep
  `cookies()` out of `"use cache"` boundaries. Orthogonal to this
  interface issue but often confused with it.
