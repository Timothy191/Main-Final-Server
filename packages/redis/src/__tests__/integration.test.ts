/**
 * Integration tests for @repo/redis
 *
 * Tests cross-module interactions between cache, eviction, and stats.
 * Uses the in-memory L1 cache layer — no Redis server required.
 * Avoids cacheWrap which has a module-level activeFetches Map that
 * persists across test files.
 */
jest.mock("../client.js", () => ({
  getRedisClient: jest.fn().mockRejectedValue(new Error("Redis connection refused")),
  getClientIfOpen: jest.fn().mockReturnValue(null),
  closeRedis: jest.fn(),
}));

import { cacheGet, cacheSet, cacheDelete, clearMemoryCache, cacheEvictL1ByPrefix } from "../cache";

beforeEach(() => {
  clearMemoryCache();
});

describe("cache-integration", () => {
  describe("set/get/delete operations", () => {
    it("should set, get, and delete values", async () => {
      await cacheSet("integration:ops:key1", "value1", 60);
      const val = await cacheGet<string>("integration:ops:key1");
      expect(val).toBe("value1");

      await cacheDelete("integration:ops:key1");
      const deleted = await cacheGet("integration:ops:key1");
      expect(deleted).toBeNull();
    });

    it("should handle non-existent keys", async () => {
      const val = await cacheGet("integration:ops:nonexistent");
      expect(val).toBeNull();
    });

    it("should handle JSON-serializable objects", async () => {
      const obj = { a: 1, b: [2, 3], c: { nested: true } };
      await cacheSet("integration:ops:obj", obj, 60);
      const val = await cacheGet<typeof obj>("integration:ops:obj");
      expect(val).toEqual(obj);
    });

    it("should overwrite existing keys", async () => {
      await cacheSet("integration:ops:overwrite", "first", 60);
      await cacheSet("integration:ops:overwrite", "second", 60);
      const val = await cacheGet("integration:ops:overwrite");
      expect(val).toBe("second");
    });

    it("should not throw when deleting a missing key", async () => {
      await expect(cacheDelete("already-missing")).resolves.not.toThrow();
    });
  });

  describe("clearMemoryCache", () => {
    it("should clear all entries", async () => {
      await cacheSet("integration:clear:a", "a", 60);
      await cacheSet("integration:clear:b", "b", 60);
      expect(await cacheGet("integration:clear:a")).toBe("a");

      clearMemoryCache();
      expect(await cacheGet("integration:clear:a")).toBeNull();
      expect(await cacheGet("integration:clear:b")).toBeNull();
    });

    it("should be idempotent", () => {
      expect(() => clearMemoryCache()).not.toThrow();
    });
  });

  describe("cacheEvictL1ByPrefix", () => {
    it("should evict entries matching prefix", async () => {
      await cacheSet("dept:1:data", "x", 60);
      await cacheSet("dept:2:data", "y", 60);
      await cacheSet("other:data", "z", 60);

      cacheEvictL1ByPrefix("dept:");

      expect(await cacheGet("dept:1:data")).toBeNull();
      expect(await cacheGet("dept:2:data")).toBeNull();
      expect(await cacheGet("other:data")).toBe("z");
    });

    it("should not affect unrelated prefixes", async () => {
      await cacheSet("a:key", "a", 60);
      await cacheSet("b:key", "b", 60);

      cacheEvictL1ByPrefix("a:");

      expect(await cacheGet("a:key")).toBeNull();
      expect(await cacheGet("b:key")).toBe("b");
    });

    it("should handle empty prefix gracefully", () => {
      expect(() => cacheEvictL1ByPrefix("")).not.toThrow();
    });
  });

  describe("L1 TTL expiry", () => {
    it("should return null after negative TTL", async () => {
      await cacheSet("integration:ttl:neg", "value", -1);
      const result = await cacheGet("integration:ttl:neg");
      expect(result).toBeNull();
    });

    it("should persist values with positive TTL", async () => {
      await cacheSet("integration:ttl:pos", "alive", 60);
      const result = await cacheGet("integration:ttl:pos");
      expect(result).toBe("alive");
    });
  });
});
