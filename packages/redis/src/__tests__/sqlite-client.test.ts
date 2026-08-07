import { SQLiteCacheEngine } from '../sqlite-client'
import { unlinkSync, existsSync } from 'fs'

describe('SQLiteCacheEngine', () => {
  const dbPath = 'test-cache.db'
  let engine: SQLiteCacheEngine

  beforeEach(() => {
    if (existsSync(dbPath)) {
      try {
        unlinkSync(dbPath)
      } catch {}
    }
    engine = new SQLiteCacheEngine(dbPath)
  })

  afterEach(async () => {
    await engine.quit()
    if (existsSync(dbPath)) {
      try {
        unlinkSync(dbPath)
      } catch {}
    }
  })

  it('should store and retrieve string values', async () => {
    await engine.set('foo', 'bar', 'EX', 10)
    const value = await engine.get('foo')
    expect(value).toBe('bar')
  })

  it('should return null for expired strings', async () => {
    await engine.set('expire-me', 'val', 'PX', 1)
    await new Promise((r) => setTimeout(r, 5))
    const value = await engine.get('expire-me')
    expect(value).toBeNull()
  })

  it('should support deletions', async () => {
    await engine.set('del-key', 'data')
    const result = await engine.del('del-key')
    expect(result).toBe(1)
    expect(await engine.get('del-key')).toBeNull()
  })

  it('should support increments (incr)', async () => {
    const val1 = await engine.incr('counter')
    expect(val1).toBe(1)
    const val2 = await engine.incr('counter')
    expect(val2).toBe(2)
  })

  it('should support set operations (sadd)', async () => {
    const count1 = await engine.sadd('myset', 'a', 'b')
    expect(count1).toBe(2)
    const count2 = await engine.sadd('myset', 'b', 'c')
    expect(count2).toBe(1) // 'b' is already in set
  })

  it('should support hash operations (hincrby, hgetall)', async () => {
    const v1 = await engine.hincrby('myhash', 'field1', 5)
    expect(v1).toBe(5)
    const v2 = await engine.hincrby('myhash', 'field1', 3)
    expect(v2).toBe(8)

    const all = await engine.hgetall('myhash')
    expect(all).toEqual({ field1: '8' })
  })

  it('should support list operations (lpush, lrange, ltrim)', async () => {
    await engine.lpush('mylist', 'z')
    await engine.lpush('mylist', 'y')
    await engine.lpush('mylist', 'x')

    const range = await engine.lrange('mylist', 0, -1)
    expect(range).toEqual(['x', 'y', 'z'])

    await engine.ltrim('mylist', 0, 1)
    const trimmed = await engine.lrange('mylist', 0, -1)
    expect(trimmed).toEqual(['x', 'y'])
  })
})
