/**
 * Unit tests for the Next.js 16 Redis-backed CacheHandler.
 *
 * @repo/redis is mocked via setupTests.ts (in-memory Map stub),
 * so these tests run fully offline without a real Redis connection.
 */

// Mock @repo/redis/cache and @repo/redis/invalidation at the module level
jest.mock('@repo/redis/cache', () => ({
  cacheGet: jest.fn(),
  cacheSetWithTags: jest.fn(),
}))
jest.mock('@repo/redis/invalidation', () => ({
  cacheInvalidateTags: jest.fn(),
}))

import { cacheGet, cacheSetWithTags } from '@repo/redis/cache'
import { cacheInvalidateTags } from '@repo/redis/invalidation'
import NextCacheHandler from '../next-cache-handler'

const mockCacheGet = cacheGet as jest.MockedFunction<typeof cacheGet>
const mockCacheSetWithTags = cacheSetWithTags as jest.MockedFunction<typeof cacheSetWithTags>
const mockCacheInvalidateTags = cacheInvalidateTags as jest.MockedFunction<
  typeof cacheInvalidateTags
>

describe('NextCacheHandler', () => {
  let handler: NextCacheHandler

  beforeEach(() => {
    handler = new NextCacheHandler()
    jest.clearAllMocks()
  })

  describe('get()', () => {
    it('returns null on cache miss (Redis returns null)', async () => {
      mockCacheGet.mockResolvedValueOnce(null)
      const result = await handler.get('test-key')
      expect(result).toBeNull()
      expect(mockCacheGet).toHaveBeenCalledWith('test-key')
    })

    it('returns cached entry on cache hit', async () => {
      const entry = { value: { data: 'test' }, lastModified: Date.now(), tags: ['tag-a'] }
      mockCacheGet.mockResolvedValueOnce(entry)

      const result = await handler.get('test-key')
      expect(result).toEqual(entry)
    })

    it('returns from per-request cache without hitting Redis on second get()', async () => {
      const entry = { value: { data: 'cached' }, lastModified: Date.now(), tags: ['tag-b'] }
      mockCacheSetWithTags.mockResolvedValueOnce(undefined)
      mockCacheGet.mockResolvedValueOnce(null)

      // First: set to populate per-request cache
      await handler.set('test-key-2', entry.value, { tags: ['tag-b'], revalidate: 60 })

      // Second: get should return from per-request cache, not Redis
      const result = await handler.get('test-key-2')
      expect(result).not.toBeNull()
      expect(result?.tags).toContain('tag-b')
      // cacheGet should NOT have been called again
      expect(mockCacheGet).not.toHaveBeenCalledWith('test-key-2')
    })

    it('returns null gracefully when Redis throws', async () => {
      mockCacheGet.mockRejectedValueOnce(new Error('Redis unavailable'))
      const result = await handler.get('error-key')
      expect(result).toBeNull()
    })
  })

  describe('set()', () => {
    it('stores the entry and indexes tags in Redis', async () => {
      mockCacheSetWithTags.mockResolvedValueOnce(undefined)

      await handler.set(
        'dept-key',
        { metrics: { count: 42 } },
        {
          tags: ['department-dashboard', 'table:machines'],
          revalidate: 300,
        }
      )

      expect(mockCacheSetWithTags).toHaveBeenCalledWith(
        'dept-key',
        expect.objectContaining({
          value: { metrics: { count: 42 } },
          tags: ['department-dashboard', 'table:machines'],
        }),
        300,
        ['department-dashboard', 'table:machines']
      )
    })

    it('uses DEFAULT_TTL (300s) when revalidate is false', async () => {
      mockCacheSetWithTags.mockResolvedValueOnce(undefined)

      await handler.set('no-revalidate-key', { val: 1 }, { revalidate: false })

      expect(mockCacheSetWithTags).toHaveBeenCalledWith(
        'no-revalidate-key',
        expect.anything(),
        300,
        []
      )
    })

    it('does not throw when Redis is unavailable', async () => {
      mockCacheSetWithTags.mockRejectedValueOnce(new Error('Connection refused'))

      await expect(
        handler.set('key', { val: 1 }, { tags: ['tag'], revalidate: 60 })
      ).resolves.not.toThrow()
    })
  })

  describe('revalidateTag()', () => {
    it('calls cacheInvalidateTags with a single tag as array', async () => {
      mockCacheInvalidateTags.mockResolvedValueOnce(1)

      await handler.revalidateTag('department-production')

      expect(mockCacheInvalidateTags).toHaveBeenCalledWith(['department-production'])
    })

    it('calls cacheInvalidateTags with multiple tags array', async () => {
      mockCacheInvalidateTags.mockResolvedValueOnce(3)

      await handler.revalidateTag(['table:machines', 'table:daily_logs', 'department-dashboard'])

      expect(mockCacheInvalidateTags).toHaveBeenCalledWith([
        'table:machines',
        'table:daily_logs',
        'department-dashboard',
      ])
    })

    it('does not throw when Redis is unavailable during revalidation', async () => {
      mockCacheInvalidateTags.mockRejectedValueOnce(new Error('Redis timeout'))

      await expect(handler.revalidateTag('some-tag')).resolves.not.toThrow()
    })
  })

  describe('resetRequestCache()', () => {
    it('clears the per-request cache so subsequent get() hits Redis', async () => {
      mockCacheSetWithTags.mockResolvedValueOnce(undefined)
      mockCacheGet.mockResolvedValueOnce(null)

      // Populate per-request cache
      await handler.set('reset-key', { v: 1 }, { tags: [], revalidate: 60 })

      // Reset should clear it
      handler.resetRequestCache()

      // Now get() should query Redis (not find it in per-request cache)
      mockCacheGet.mockResolvedValueOnce(null)
      await handler.get('reset-key')
      expect(mockCacheGet).toHaveBeenCalledWith('reset-key')
    })
  })
})
