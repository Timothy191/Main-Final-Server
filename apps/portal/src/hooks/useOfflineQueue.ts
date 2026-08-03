/**
 * useOfflineQueue — IndexedDB-backed offline mutation queue.
 *
 * Persists pending mutations (POST/PUT/PATCH/DELETE) when the browser is
 * offline and replays them once connectivity is restored. Uses a simple
 * retry strategy with exponential backoff.
 *
 * Usage:
 *   const { isOnline, pendingCount, enqueue, syncNow } = useOfflineQueue();
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface OfflineMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
  retries: number;
  status: "pending" | "syncing" | "failed";
  lastError?: string;
}

export interface OfflineQueueEvents {
  onSyncStart?: () => void;
  onSyncComplete?: (synced: number, failed: number) => void;
  onSyncError?: (error: Error) => void;
}

/* ------------------------------------------------------------------ */
/*  IndexedDB helpers                                                  */
/* ------------------------------------------------------------------ */

const DB_NAME = "arch-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "mutations";

let dbCache: IDBDatabase | null = null;

/**
 * Reset the cached DB connection. Test-only — tree-shaken in production builds.
 */
/* istanbul ignore next */
export function _resetDBCacheForTesting(): void {
  if (dbCache) {
    try {
      dbCache.close();
    } catch {
      /* ignore — connection may already be closed */
    }
  }
  dbCache = null;
}

function openDB(): Promise<IDBDatabase> {
  if (dbCache) return Promise.resolve(dbCache);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => {
      dbCache = request.result;
      request.result.onclose = () => {
        dbCache = null;
      };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getAllMutations(): Promise<OfflineMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as OfflineMutation[]);
    request.onerror = () => reject(request.error);
  });
}

async function addMutation(mutation: OfflineMutation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function updateMutation(mutation: OfflineMutation): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteMutation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearCompleted(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("status");
    const syncedReq = index.openCursor(IDBKeyRange.only("synced"));
    syncedReq.onsuccess = () => {
      const cursor = syncedReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    const failedReq = index.openCursor(IDBKeyRange.only("failed"));
    failedReq.onsuccess = () => {
      const cursor = failedReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ------------------------------------------------------------------ */
/*  Sync logic                                                         */
/* ------------------------------------------------------------------ */

/** @internal exported for testing only */
export const MAX_RETRIES = 5;

async function replayMutation(mutation: OfflineMutation): Promise<boolean> {
  try {
    const response = await fetch(mutation.url, {
      method: mutation.method,
      headers: {
        ...mutation.headers,
        "X-Offline-Replay": "true",
      },
      body: mutation.body ?? undefined,
    });

    if (response.ok) {
      await deleteMutation(mutation.id);
      return true;
    }

    // Server error — mark as failed if max retries exceeded
    if (mutation.retries >= MAX_RETRIES) {
      await updateMutation({
        ...mutation,
        status: "failed",
        lastError: `HTTP ${response.status}`,
      });
      return false;
    }

    // Retryable — increment retries
    await updateMutation({
      ...mutation,
      status: "pending",
      retries: mutation.retries + 1,
      lastError: `HTTP ${response.status}`,
    });
    return false;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    // Network error — mark as failed if max retries exceeded
    if (mutation.retries >= MAX_RETRIES) {
      await updateMutation({
        ...mutation,
        status: "failed",
        lastError: msg,
      });
      return false;
    }

    await updateMutation({
      ...mutation,
      status: "pending",
      retries: mutation.retries + 1,
      lastError: msg,
    });
    return false;
  }
}

async function syncAll(events?: OfflineQueueEvents): Promise<{ synced: number; failed: number }> {
  events?.onSyncStart?.();

  let pending: OfflineMutation[];
  try {
    const mutations = await getAllMutations();
    pending = mutations.filter((m) => m.status === "pending");
  } catch (error) {
    events?.onSyncError?.(error instanceof Error ? error : new Error(String(error)));
    return { synced: 0, failed: 0 };
  }

  if (pending.length === 0) {
    events?.onSyncComplete?.(0, 0);
    return { synced: 0, failed: 0 };
  }

  // Sort by creation time (oldest first) for FIFO replay
  pending.sort((a, b) => a.createdAt - b.createdAt);

  let synced = 0;
  let failed = 0;

  for (const mutation of pending) {
    try {
      await updateMutation({ ...mutation, status: "syncing" });
    } catch (err) {
      // If we can't mark as syncing, reset to pending and skip
      try {
        await updateMutation({ ...mutation, status: "pending" });
      } catch {
        // Best effort — mutation may be stuck
      }
      failed++;
      continue;
    }
    const success = await replayMutation(mutation);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  try {
    await clearCompleted();
  } catch {
    // Best-effort cleanup — stale entries will be retried on next sync
  }

  events?.onSyncComplete?.(synced, failed);

  return { synced, failed };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useOfflineQueue(events?: OfflineQueueEvents) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  // Update online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh pending count on mount and after sync
  const refreshCount = useCallback(async () => {
    try {
      const mutations = await getAllMutations();
      const pending = mutations.filter((m) => m.status === "pending");
      setPendingCount(pending.length);
    } catch {
      // IndexedDB not available (SSR or private browsing)
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncingRef.current) {
      syncingRef.current = true;
      syncAll(events)
        .then(() => refreshCount())
        .catch((err) => events?.onSyncError?.(err))
        .finally(() => {
          syncingRef.current = false;
        });
    }
  }, [isOnline, pendingCount, events, refreshCount]);

  /**
   * Enqueue a mutation for offline replay.
   * If online, executes immediately. If offline, stores in IndexedDB.
   */
  const enqueue = useCallback(
    async (
      url: string,
      options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
    ): Promise<{ queued: boolean; response?: Response }> => {
      const method = (options.method ?? "POST").toUpperCase();
      const headers = options.headers ?? {};
      const body = options.body ? JSON.stringify(options.body) : null;

      // If online, try to execute immediately
      if (navigator.onLine) {
        try {
          const response = await fetch(url, {
            method,
            headers,
            body: body ?? undefined,
          });

          if (response.ok) {
            return { queued: false, response };
          }

          // Server rejected — queue for retry
        } catch {
          // Network error — queue
        }
      }

      // Queue for offline replay
      // Note: IndexedDB is same-origin and not exfiltratable, so we persist
      // headers as-is. Auth tokens are re-used on replay automatically.
      const mutation: OfflineMutation = {
        id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        method,
        headers,
        body,
        createdAt: Date.now(),
        retries: 0,
        status: "pending",
      };

      await addMutation(mutation);
      await refreshCount();

      return { queued: true };
    },
    [refreshCount]
  );

  /**
   * Manually trigger sync of all pending mutations.
   */
  const syncNow = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (syncingRef.current) return { synced: 0, failed: 0 };
    syncingRef.current = true;

    try {
      const result = await syncAll(events);
      await refreshCount();
      return result;
    } finally {
      syncingRef.current = false;
    }
  }, [events, refreshCount]);

  /**
   * Clear all pending/failed mutations from the queue.
   */
  const clearQueue = useCallback(async () => {
    const mutations = await getAllMutations();
    for (const m of mutations) {
      await deleteMutation(m.id);
    }
    await refreshCount();
  }, [refreshCount]);

  return {
    isOnline,
    pendingCount,
    enqueue,
    syncNow,
    clearQueue,
  };
}

/**
 * Initialize offline queue listeners (for non-hook contexts like Server Actions).
 * Call once on app startup.
 */
export function initOfflineQueueListeners(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    syncAll().catch(() => {
      // Silent — will retry on next online event
    });
  });
}
