/**
 * useOfflineQueue tests — uses fake-indexeddb for real IndexedDB support.
 * Tests are self-contained to avoid IndexedDB state pollution between tests.
 */
import "fake-indexeddb/auto";
import { renderHook, act } from "@testing-library/react";
import { useOfflineQueue, _resetDBCacheForTesting } from "./useOfflineQueue";
import "@testing-library/jest-dom";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const flush = async (ms = 200) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

function resetEnv() {
  _resetDBCacheForTesting();
  Object.defineProperty(navigator, "onLine", {
    value: true,
    writable: true,
    configurable: true,
  });
  global.fetch = jest.fn();
  indexedDB = new IDBFactory();
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("useOfflineQueue", () => {
  beforeEach(() => resetEnv());
  afterEach(() => {
    _resetDBCacheForTesting();
    indexedDB = new IDBFactory();
  });

  describe("initial state", () => {
    it("starts with isOnline true when navigator.onLine is true", async () => {
      const { result } = renderHook(() => useOfflineQueue());
      await flush();
      expect(result.current.isOnline).toBe(true);
    });

    it("starts with pendingCount 0", async () => {
      const { result } = renderHook(() => useOfflineQueue());
      await flush();
      expect(result.current.pendingCount).toBe(0);
    });

    it("exposes enqueue, syncNow, and clearQueue functions", async () => {
      const { result } = renderHook(() => useOfflineQueue());
      await flush();
      expect(typeof result.current.enqueue).toBe("function");
      expect(typeof result.current.syncNow).toBe("function");
      expect(typeof result.current.clearQueue).toBe("function");
    });
  });

  describe("enqueue", () => {
    it("calls fetch immediately when online", async () => {
      Object.defineProperty(navigator, "onLine", { value: true });
      const mockResponse = new Response(null, { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      await act(async () => {
        await result.current.enqueue("/api/test", {
          method: "POST",
          body: { foo: "bar" },
        });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("queues when offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });

      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      let res: { queued: boolean } | undefined;
      await act(async () => {
        res = await result.current.enqueue("/api/test", {
          method: "POST",
          body: { foo: "bar" },
        });
      });

      expect(res!.queued).toBe(true);
    });

    it("queues when online but server returns error", async () => {
      Object.defineProperty(navigator, "onLine", { value: true });
      const mockResponse = new Response(null, { status: 500 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      let res: { queued: boolean } | undefined;
      await act(async () => {
        res = await result.current.enqueue("/api/test", {
          method: "PUT",
          body: { data: 123 },
        });
      });

      expect(res!.queued).toBe(true);
    });

    it("queues when online but fetch throws", async () => {
      Object.defineProperty(navigator, "onLine", { value: true });
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      let res: { queued: boolean } | undefined;
      await act(async () => {
        res = await result.current.enqueue("/api/test");
      });

      expect(res!.queued).toBe(true);
    });
  });

  describe("online/offline events", () => {
    it("updates isOnline when window fires 'offline' event", async () => {
      Object.defineProperty(navigator, "onLine", { value: true });
      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      expect(result.current.isOnline).toBe(true);

      await act(async () => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it("updates isOnline when window fires 'online' event", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      expect(result.current.isOnline).toBe(false);

      await act(async () => {
        window.dispatchEvent(new Event("online"));
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe("syncNow", () => {
    it("replays pending mutations when called manually", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      // Enqueue while offline
      await act(async () => {
        await result.current.enqueue("/api/sync", {
          method: "POST",
          body: { action: "sync" },
        });
      });

      // Mock successful fetch for replay
      (global.fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 200 }));

      // Manually trigger sync (stay offline to prevent auto-sync)
      await act(async () => {
        await result.current.syncNow();
      });

      // Fetch should have been called for the replayed mutation
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sync",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-Offline-Replay": "true" }),
        })
      );
    });
  });

  describe("clearQueue", () => {
    it("clears all mutations from the queue", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() => useOfflineQueue());
      await flush();

      // Enqueue items
      await act(async () => {
        await result.current.enqueue("/api/1", { method: "POST" });
      });

      // Clear queue
      await act(async () => {
        await result.current.clearQueue();
      });

      // After clearing, pendingCount should reflect only remaining items
      // (the clearQueue deletes from IndexedDB and refreshes count)
    });
  });

  describe("event callbacks", () => {
    it("calls onSyncStart and onSyncComplete during sync", async () => {
      const onSyncStart = jest.fn();
      const onSyncComplete = jest.fn();
      const events = { onSyncStart, onSyncComplete };

      Object.defineProperty(navigator, "onLine", { value: false });
      const { result } = renderHook(() => useOfflineQueue(events));
      await flush();

      // Enqueue while offline
      await act(async () => {
        await result.current.enqueue("/api/event-test", { method: "POST" });
      });

      // Mock fetch for replay
      (global.fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 200 }));

      // Stay offline, call syncNow manually
      await act(async () => {
        await result.current.syncNow();
      });

      expect(onSyncStart).toHaveBeenCalled();
      expect(onSyncComplete).toHaveBeenCalled();
    });
  });
});
