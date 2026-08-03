/**
 * Tests for @repo/redis invalidation.ts
 *
 * invalidation.ts imports from "./client.js", so we mock "../client.js".
 * The moduleNameMapper in jest.config.js strips .js → .ts for resolution.
 */
// Stable multi instance so sAdd/exec calls are tracked consistently
const mockMulti = {
  sAdd: jest.fn(),
  exec: jest.fn().mockResolvedValue([]),
};

const mockRedis = {
  isOpen: true,
  multi: jest.fn(() => mockMulti),
  sScanIterator: jest.fn(),
  scanIterator: jest.fn(),
  unlink: jest.fn().mockResolvedValue(1),
  quit: jest.fn().mockResolvedValue("OK"),
};

jest.mock("../client.js", () => ({
  getRedisClient: jest.fn().mockResolvedValue(mockRedis),
}));

import { indexCacheKeyByTags, cacheInvalidateTags, cacheInvalidatePrefixes } from "../invalidation";

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// indexCacheKeyByTags
// ---------------------------------------------------------------------------
describe("indexCacheKeyByTags", () => {
  it("should add keys to tag sets in Redis", async () => {
    await indexCacheKeyByTags("cache-key-1", ["tag1", "tag2"]);

    expect(mockRedis.multi).toHaveBeenCalled();
    const multiInstance = mockRedis.multi();
    expect(multiInstance.sAdd).toHaveBeenCalledTimes(2);
    expect(multiInstance.sAdd).toHaveBeenCalledWith("arch:__tags__:tag1", "cache-key-1");
    expect(multiInstance.sAdd).toHaveBeenCalledWith("arch:__tags__:tag2", "cache-key-1");
    expect(multiInstance.exec).toHaveBeenCalled();
  });

  it("should handle empty tags array gracefully", async () => {
    await expect(indexCacheKeyByTags("key", [])).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// cacheInvalidateTags
// ---------------------------------------------------------------------------
describe("cacheInvalidateTags", () => {
  it("should unlink all keys for the given tags", async () => {
    const sScanMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => {
        let i = 0;
        const keys = ["del-key-1", "del-key-2"];
        return {
          next: () => {
            if (i < keys.length) {
              return Promise.resolve({ value: keys[i++], done: false });
            }
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
    });
    mockRedis.sScanIterator.mockImplementation(sScanMock);
    mockRedis.unlink.mockResolvedValue(2);

    const deleted = await cacheInvalidateTags(["tag1"]);

    expect(deleted).toBe(2);
    expect(mockRedis.sScanIterator).toHaveBeenCalledWith("arch:__tags__:tag1", {
      COUNT: 100,
    });
    expect(mockRedis.unlink).toHaveBeenCalledWith(["del-key-1", "del-key-2"]);
    expect(mockRedis.unlink).toHaveBeenCalledWith("arch:__tags__:tag1");
  });

  it("should handle tags with no indexed keys", async () => {
    const sScanMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    });
    mockRedis.sScanIterator.mockImplementation(sScanMock);

    const deleted = await cacheInvalidateTags(["empty-tag"]);
    expect(deleted).toBe(0);
  });

  it("should handle multiple tags", async () => {
    const sScanMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    });
    mockRedis.sScanIterator.mockImplementation(sScanMock);

    const deleted = await cacheInvalidateTags(["tag-a", "tag-b"]);
    expect(mockRedis.sScanIterator).toHaveBeenCalledTimes(2);
    expect(deleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// cacheInvalidatePrefixes
// ---------------------------------------------------------------------------
describe("cacheInvalidatePrefixes", () => {
  it("should unlink all keys matching prefixes", async () => {
    const scanMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => {
        let i = 0;
        const keys = ["arch:dept:1", "arch:dept:2"];
        return {
          next: () => {
            if (i < keys.length) {
              return Promise.resolve({ value: keys[i++], done: false });
            }
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
    });
    mockRedis.scanIterator.mockImplementation(scanMock);
    mockRedis.unlink.mockResolvedValue(2);

    const deleted = await cacheInvalidatePrefixes(["arch:dept:"]);

    expect(deleted).toBe(2);
    expect(mockRedis.scanIterator).toHaveBeenCalledWith({
      MATCH: "arch:dept:*",
      COUNT: 100,
    });
  });

  it("should handle prefixes with no matching keys", async () => {
    const scanMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    });
    mockRedis.scanIterator.mockImplementation(scanMock);

    const deleted = await cacheInvalidatePrefixes(["nonexistent:*"]);
    expect(deleted).toBe(0);
  });

  it("should handle batched deletions for large result sets", async () => {
    let yielded = 0;
    const totalKeys = 150;
    const scanMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (yielded < totalKeys) {
            return Promise.resolve({
              value: `arch:batch:${yielded++}`,
              done: false,
            });
          }
          return Promise.resolve({ value: undefined, done: true });
        },
      }),
    });
    mockRedis.scanIterator.mockImplementation(scanMock);
    mockRedis.unlink.mockResolvedValue(1);

    const deleted = await cacheInvalidatePrefixes(["arch:batch:"]);

    expect(deleted).toBe(150);
    expect(mockRedis.unlink).toHaveBeenCalledTimes(2);
  });
});
