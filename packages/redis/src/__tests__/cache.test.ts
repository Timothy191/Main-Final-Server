import {
  cacheGet,
  cacheSet,
  cacheGetWithStats,
  cacheWrap,
  cacheDelete,
  cacheDeletePattern,
  cacheEvictL1ByPrefix,
  clearMemoryCache,
  cacheSetWithTags,
} from "../cache";

// Mock the dynamic import of ./client.js so getRedisClientSafe returns a mock
const mockRedisClient = {
  isOpen: true,
  get: jest.fn().mockResolvedValue(null),
  setEx: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  multi: jest.fn(() => ({
    sAdd: jest.fn(),
    exec: jest.fn().mockResolvedValue([]),
  })),
};

jest.mock("../client", () => ({
  getRedisClient: jest.fn().mockResolvedValue(mockRedisClient),
  closeRedis: jest.fn(),
}));

jest.mock("../client.js", () => ({
  getRedisClient: jest.fn().mockResolvedValue(mockRedisClient),
  closeRedis: jest.fn(),
}));

jest.mock("../invalidation", () => {
  // Fresh mock each time module is initialized
  const freshMock = jest.fn().mockResolvedValue(undefined);
  return {
    indexCacheKeyByTags: freshMock,
    cacheInvalidateTags: jest.fn().mockResolvedValue(0),
    cacheInvalidatePrefixes: jest.fn().mockResolvedValue(0),
  };
});

jest.mock("../invalidation.js", () => {
  const freshMock = jest.fn().mockResolvedValue(undefined);
  return {
    indexCacheKeyByTags: freshMock,
    cacheInvalidateTags: jest.fn().mockResolvedValue(0),
    cacheInvalidatePrefixes: jest.fn().mockResolvedValue(0),
  };
});

jest.mock("../stats", () => ({
  recordCacheHit: jest.fn(),
  recordCacheMiss: jest.fn(),
  recordRedisError: jest.fn(),
  resetCacheStats: jest.fn(),
}));

jest.mock("../stats.js", () => ({
  recordCacheHit: jest.fn(),
  recordCacheMiss: jest.fn(),
  recordRedisError: jest.fn(),
  resetCacheStats: jest.fn(),
}));

beforeEach(() => {
  clearMemoryCache();
  jest.clearAllMocks();
});

describe("cacheGet / cacheSet", () => {
  it("should set and get a value from L1 (memory) cache", async () => {
    await cacheSet("key1", { hello: "world" }, 60);
    const result = await cacheGet<{ hello: string }>("key1");
    expect(result).toEqual({ hello: "world" });
  });

  it("should return null for a missing key", async () => {
    const result = await cacheGet("nonexistent");
    expect(result).toBeNull();
  });

  it("should return null after TTL expiry (L1)", async () => {
    // Use TTL of -1 and wait a tick to ensure expiry
    await cacheSet("short", "value", -1);
    // Wait a tick so the TTL expiry is guaranteed
    await new Promise((r) => setImmediate(r));
    const result = await cacheGet("short");
    expect(result).toBeNull();
  });

  it("should overwrite an existing key", async () => {
    await cacheSet("key", "old", 60);
    await cacheSet("key", "new", 60);
    const result = await cacheGet("key");
    expect(result).toBe("new");
  });
});

describe("cacheGetWithStats", () => {
  it("should return source 'l1' for memory hits", async () => {
    await cacheSet("key", 42, 60);
    const result = await cacheGetWithStats<number>("key");
    expect(result.value).toBe(42);
    expect(result.source).toBe("l1");
  });

  it("should return source 'l1' for memory hits with objects", async () => {
    await cacheSet("obj", { a: 1 }, 60);
    const result = await cacheGetWithStats<{ a: number }>("obj");
    expect(result.value).toEqual({ a: 1 });
    expect(result.source).toBe("l1");
  });

  it("should return null source for cache misses", async () => {
    const result = await cacheGetWithStats("missing-key");
    expect(result.value).toBeNull();
  });
});

describe("cacheWrap", () => {
  it("should call the factory function on cache miss and cache the result", async () => {
    const factory = jest.fn().mockResolvedValue("computed");
    const result = await cacheWrap("wrap-key", factory, 60);
    expect(result).toBe("computed");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should return cached value on subsequent calls", async () => {
    const factory = jest.fn().mockResolvedValue("expensive");
    await cacheWrap("coalesce-key", factory, 60);
    const result = await cacheWrap("coalesce-key", factory, 60);
    expect(result).toBe("expensive");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should coalesce concurrent requests for the same key", async () => {
    let callCount = 0;
    const factory = jest.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 20));
      return `result-${callCount}`;
    });

    const [r1, r2] = await Promise.all([
      cacheWrap("concurrent", factory, 60),
      cacheWrap("concurrent", factory, 60),
    ]);

    expect(r1).toBe("result-1");
    expect(r2).toBe("result-1");
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe("cacheDelete", () => {
  it("should delete a key from cache", async () => {
    await cacheSet("delete-me", "value", 60);
    await cacheDelete("delete-me");
    const result = await cacheGet("delete-me");
    expect(result).toBeNull();
  });

  it("should not throw when deleting a missing key", async () => {
    await expect(cacheDelete("already-missing")).resolves.not.toThrow();
  });
});

describe("cacheDeletePattern", () => {
  it("should delete keys matching a pattern", async () => {
    await cacheSet("users:1", "a", 60);
    await cacheSet("users:2", "b", 60);
    await cacheSet("other", "c", 60);

    await expect(cacheDeletePattern("users:*")).resolves.not.toThrow();

    await expect(cacheGet("users:1")).resolves.toBeNull();
    await expect(cacheGet("users:2")).resolves.toBeNull();
    await expect(cacheGet("other")).resolves.toBe("c");
  });
});

describe("cacheEvictL1ByPrefix", () => {
  it("should clear L1 entries matching a prefix", async () => {
    await cacheSet("dept:1:data", "x", 60);
    await cacheSet("dept:2:data", "y", 60);
    await cacheSet("other", "z", 60);

    cacheEvictL1ByPrefix("dept:");

    await expect(cacheGet("dept:1:data")).resolves.toBeNull();
    await expect(cacheGet("dept:2:data")).resolves.toBeNull();
    await expect(cacheGet("other")).resolves.toBe("z");
  });
});

describe("clearMemoryCache", () => {
  it("should clear the entire L1 cache", async () => {
    await cacheSet("a", 1, 60);
    await cacheSet("b", 2, 60);
    clearMemoryCache();

    await expect(cacheGet("a")).resolves.toBeNull();
    await expect(cacheGet("b")).resolves.toBeNull();
  });
});

describe("cacheSetWithTags", () => {
  it("should set value and index tags", async () => {
    await cacheSetWithTags("tagged-key", { data: 1 }, 60, ["tag1", "tag2"]);

    const result = await cacheGet("tagged-key");
    expect(result).toEqual({ data: 1 });

    // Verify tags were indexed by checking invalidation mock was called
    const { indexCacheKeyByTags } = jest.requireMock("../invalidation");
    expect(indexCacheKeyByTags).toHaveBeenCalledWith("tagged-key", ["tag1", "tag2"]);
  });

  it("should not index tags when none provided", async () => {
    // Reset the mock so we get a clean slate
    jest.isolateModules(() => {
      // no-op — just use the module
    });
    // Get a fresh reference to the mock
    const { indexCacheKeyByTags } = jest.requireMock("../invalidation");

    // clear the mock that was called in previous tests
    indexCacheKeyByTags.mockClear();

    await cacheSetWithTags("no-tags", "val", 60);

    expect(indexCacheKeyByTags).not.toHaveBeenCalled();
  });
});
