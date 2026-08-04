/**
 * Tests the L1 tag-eviction path: cacheSetWithTags indexes L1 tags and
 * cacheInvalidateTags evicts the matching L1 entries immediately.
 */
const mockMulti = {
  sadd: jest.fn(),
  exec: jest.fn().mockResolvedValue([]),
}

const emptyAsyncIterable = {
  [Symbol.asyncIterator]: () => ({
    next: () => Promise.resolve({ value: undefined, done: true }),
  }),
}

const mockRedis = {
  isOpen: true,
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  unlink: jest.fn().mockResolvedValue(1),
  multi: jest.fn(() => mockMulti),
  sscanStream: jest.fn(() => emptyAsyncIterable),
  scanStream: jest.fn(() => emptyAsyncIterable),
  quit: jest.fn().mockResolvedValue('OK'),
}

jest.mock('../client.js', () => ({
  getRedisClient: jest.fn().mockResolvedValue(mockRedis),
  getClientIfOpen: jest.fn(() => null),
}))

import { cacheGet, cacheSetWithTags, clearMemoryCache } from '../cache'
import { cacheInvalidateTags, cacheInvalidatePrefixes } from '../invalidation'
import { l1Set, l1Get, l1IndexTags, l1EvictByTags, l1DeleteByPrefix, l1Clear } from '../l1'

beforeEach(() => {
  jest.clearAllMocks()
  clearMemoryCache()
})

describe('L1 tag eviction (cache + invalidation integration)', () => {
  it('set with tags → invalidate tag → immediate L1 miss', async () => {
    await cacheSetWithTags('dept:drilling', { rigs: 4 }, 300, ['department:drilling'])

    // Served from L1 without touching Redis get
    expect(await cacheGet('dept:drilling')).toEqual({ rigs: 4 })
    expect(mockRedis.get).not.toHaveBeenCalled()

    await cacheInvalidateTags(['department:drilling'])

    // L1 evicted — falls through to Redis (mocked null) → miss
    expect(await cacheGet('dept:drilling')).toBeNull()
    expect(mockRedis.get).toHaveBeenCalledWith('dept:drilling')
  })

  it('only evicts keys indexed under the invalidated tag', async () => {
    await cacheSetWithTags('key-a', 'a', 300, ['tag-a'])
    await cacheSetWithTags('key-b', 'b', 300, ['tag-b'])

    await cacheInvalidateTags(['tag-a'])

    expect(await cacheGet('key-a')).toBeNull()
    expect(await cacheGet('key-b')).toBe('b')
  })

  it('cacheInvalidatePrefixes clears matching L1 entries', async () => {
    await cacheSetWithTags('arch:dept:1', 1, 300, ['t'])
    await cacheSetWithTags('other:key', 2, 300, ['t'])

    await cacheInvalidatePrefixes(['arch:dept:'])

    expect(await cacheGet('arch:dept:1')).toBeNull()
    expect(await cacheGet('other:key')).toBe(2)
  })
})

describe('l1 primitives', () => {
  afterEach(() => l1Clear())

  it('l1EvictByTags returns eviction count and clears the tag index', () => {
    l1Set('k1', 'v1', 60)
    l1Set('k2', 'v2', 60)
    l1IndexTags('k1', ['t1'])
    l1IndexTags('k2', ['t1'])

    expect(l1EvictByTags(['t1'])).toBe(2)
    expect(l1Get('k1')).toBeNull()
    expect(l1Get('k2')).toBeNull()
    // Second eviction finds nothing — index was cleared
    expect(l1EvictByTags(['t1'])).toBe(0)
  })

  it('l1DeleteByPrefix removes only matching keys', () => {
    l1Set('pre:1', 1, 60)
    l1Set('nope:2', 2, 60)

    l1DeleteByPrefix('pre:')

    expect(l1Get('pre:1')).toBeNull()
    expect(l1Get('nope:2')).toBe(2)
  })
})
