/**
 * Tests for @repo/redis invalidation.ts
 *
 * invalidation.ts imports from "./client.js", so we mock "../client.js".
 * The moduleNameMapper in jest.config.js strips .js → .ts for resolution.
 *
 * Mock methods match ioredis and NativeRedisClient API:
 *   - multi() returns pipeline with .sadd() and .exec()
 *   - sscanStream() returns async iterable
 *   - scanStream() returns async iterable
 *   - unlink() deletes keys
 */
// Stable multi instance so sadd/exec calls are tracked consistently
const mockMulti = {
  sadd: jest.fn(),
  exec: jest.fn().mockResolvedValue([]),
};

const mockRedis = {
  isOpen: true,
  multi: jest.fn(() => mockMulti),
  sscanStream: jest.fn(),
  scanStream: jest.fn(),
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
    expect(multiInstance.sadd).toHaveBeenCalledTimes(2);
    expect(multiInstance.sadd).toHaveBeenCalledWith("arch:__tags__:tag1", "cache-key-1");
    expect(multiInstance.sadd).toHaveBeenCalledWith("arch:__tags__:tag2", "cache-key-1");
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
    const sscanStreamMock = jest.fn().mockReturnValue({
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
    mockRedis.sscanStream.mockImplementation(sscanStreamMock);
    mockRedis.unlink.mockResolvedValue(2);

    const deleted = await cacheInvalidateTags(["tag1"]);

    expect(deleted).toBe(2);
    expect(mockRedis.sscanStream).toHaveBeenCalledWith("arch:__tags__:tag1", {
      count: 100,
    });
    expect(mockRedis.unlink).toHaveBeenCalledWith(["del-key-1", "del-key-2"]);
    expect(mockRedis.unlink).toHaveBeenCalledWith("arch:__tags__:tag1");
  });

  it("should handle tags with no indexed keys", async () => {
    const sscanStreamMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    });
    mockRedis.sscanStream.mockImplementation(sscanStreamMock);

    const deleted = await cacheInvalidateTags(["empty-tag"]);
    expect(deleted).toBe(0);
  });

  it("should handle multiple tags", async () => {
    const sscanStreamMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    });
    mockRedis.sscanStream.mockImplementation(sscanStreamMock);

    const deleted = await cacheInvalidateTags(["tag-a", "tag-b"]);
    expect(mockRedis.sscanStream).toHaveBeenCalledTimes(2);
    expect(deleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// cacheInvalidatePrefixes
// ---------------------------------------------------------------------------
describe("cacheInvalidatePrefixes", () => {
  it("should unlink all keys matching prefixes", async () => {
    const scanStreamMock = jest.fn().mockReturnValue({
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
    mockRedis.scanStream.mockImplementation(scanStreamMock);
    mockRedis.unlink.mockResolvedValue(2);

    const deleted = await cacheInvalidatePrefixes(["arch:dept:"]);

    expect(deleted).toBe(2);
    expect(mockRedis.scanStream).toHaveBeenCalledWith({
      match: "arch:dept:*",
      count: 100,
    });
  });

  it("should handle prefixes with no matching keys", async () => {
    const scanStreamMock = jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    });
    mockRedis.scanStream.mockImplementation(scanStreamMock);

    const deleted = await cacheInvalidatePrefixes(["nonexistent:*"]);
    expect(deleted).toBe(0);
  });

  it("should handle batched deletions for large result sets", async () => {
    let yielded = 0;
    const totalKeys = 150;
    const scanStreamMock = jest.fn().mockReturnValue({
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
    mockRedis.scanStream.mockImplementation(scanStreamMock);
    mockRedis.unlink.mockResolvedValue(1);

    const deleted = await cacheInvalidatePrefixes(["arch:batch:"]);

    expect(deleted).toBe(150);
    expect(mockRedis.unlink).toHaveBeenCalledTimes(2);
  });
});
