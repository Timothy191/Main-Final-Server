jest.mock('./../next-cache-handler');
const redisCacheHandler = jest.requireActual('./../next-cache-handler');

const mockCacheGet = jest.fn();
const mockCacheSetWithTags = jest.fn();
const mockCacheInvalidateTags = jest.fn();

jest.mock('@repo/redis/cache', () => ({
  cacheGet: mockCacheGet,
  cacheSetWithTags: mockCacheSetWithTags,
}));     
jest.mock('@repo/redis/invalidation', () => ({
  cacheInvalidateTags: mockCacheInvalidateTags,
}));

const handler = redisCacheHandler as any;


// Basic get tests
it('returns undefined when Redis is unavailable', async () => {
  mockCacheGet.mockImplementation(() => {
    throw new Error('Redis unavailable')
  });
  const result = await handler.get('test-key');
  expect(result).toBeUndefined();
});

it('returns cached entry on cache hit', async () => {
  const entry = { value: new ReadableStream({ start: () => { throw new Error('stream error') } }), tags: ['tag-a'] };
  mockCacheGet.mockResolvedValueOnce(entry);
  const result = await handler.get('test-key');
  expect(result?.value instanceof ReadableStream).toBe(true);
});

// Basic set tests
it('stores entry in Redis with tags', async () => {
  mockCacheSetWithTags.mockResolvedValueOnce(null);
  await handler.set('dept-key', { metrics: { count: 42 } }, { tags: ['department-dashboard'] });
  expect(mockCacheSetWithTags).toHaveBeenCalledWith('dept-key', expect.anything(), 300, ['department-dashboard']);
});

// Basic updateTags tests
it('invalidates Redis cache for tags', async () => {
  mockCacheInvalidateTags.mockResolvedValueOnce(5);
  await handler.updateTags(['department-dashboard']);
  expect(mockCacheInvalidateTags).toHaveBeenCalledWith(['department-dashboard']);
});

// Empty tags test
it('uses default TTL when no tags provided', async () => {
  mockCacheSetWithTags.mockResolvedValueOnce(null);
  await handler.set('no-tags-key', { data: 'test' });
  expect(mockCacheSetWithTags).toHaveBeenCalledWith('no-tags-key', expect.anything(), 300, []);
});

// Streams test — skipped in jsdom (ReadableStream requires Node/Browser runtime)
it('handles ReadableStream objects correctly', async () => {
  if (typeof ReadableStream === 'undefined') {
    return // skip when ReadableStream is not available
  }
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1,2,3]));
      controller.close();
    }
  });
  await handler.set('stream-key', { value: stream });
  const result = await handler.get('stream-key');
  expect(result.value).toBeDefined();
});