# ADR-002: Standardized Offline-First and Optimistic Update Design Pattern

**Status:** Accepted
**Date:** 2026-08-05
**Deciders:** Platform lead, portal UX architect, offline engineering squad

## Context

Field operations in the oil & gas sector frequently occur in environments with low, intermittent, or absent network connectivity. To ensure high usability and prevent operations from blocking, the portal application must allow users to perform actions offline and experience instant visual feedback (optimistic updates).

Currently, various features handle offline states differently, leading to visual inconsistencies, data drift, and redundant logic.

## Decision

We establish a standardized pattern for offline operations and optimistic rendering based on three pillars:

```
[React View] ──(Optimistic Action)──> [React State (Instant UI Update)]
     │
     └─────────(Store Mutation)──────> [IndexedDB Queue (ArchSyncDB)]
                                                │
                                        (Network Restored)
                                                │
                                                ▼
                                      [Service Worker / Sync]
                                                │
                                                ▼
                                     [Supabase DB Playback]
```

### 1. Unified Client-Side Storage (`ArchSyncDB`)

- **IndexedDB Database:** `ArchSyncDB` (Version `1`)
- **Action Queue Store:** `actionQueue`
- **Key Schema:**
  - `id`: Auto-incrementing integer or UUID
  - `action`: String representation of the target mutation (e.g., `'create_breakdown'`)
  - `payload`: JSON object containing parameters for the API call
  - `timestamp`: ISO String when action was created
  - `status`: `'pending' | 'processing' | 'synced' | 'failed'`
  - `retryCount`: Integer counter for rate limiting/backoff

### 2. React Optimistic UI Hook (`useOptimisticAction`)

A standard React Hook to manage local state immediately ahead of network confirmation:

```typescript
import { useOptimistic, startTransition } from 'react'

export function useOptimisticList<T extends { id: string | number }>(
  initialData: T[],
  updateFn: (item: T) => Promise<void>
) {
  const [optimisticState, setOptimisticState] = useOptimistic(initialData, (state, newItem: T) => [
    ...state,
    newItem,
  ])

  const performAction = async (newItem: T) => {
    startTransition(async () => {
      setOptimisticState(newItem)
      await updateFn(newItem)
    })
  }

  return [optimisticState, performAction] as const
}
```

### 3. Service Worker Background Synchronization

- **SW Registration:** `public/sw.js` handles static asset caching (Cache-First) and intercepts fetch failures to queue them into `ArchSyncDB`.
- **Sync Event:** Listen to the browser `sync` event or fall back to polling network status to play back the `actionQueue` sequentially to the API.

## Consequences

- **What becomes easier:** Instant visual response for users in remote fields, consistent layout behaviors under network loss, and robust retry logic.
- **What we'll need to revisit:** Conflict resolution strategies (e.g. Last-Write-Wins vs. Interactive Merge) when multiple field operators modify the same record.
