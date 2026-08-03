import { withCache } from './cache-utils'

describe('withCache (no-op passthrough)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls the provided function and returns its result', async () => {
    const fn = jest.fn().mockResolvedValue('data')

    const result = await withCache(fn, { category: 'auth', keyParts: ['123'] })

    expect(result).toBe('data')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes through synchronous return values', () => {
    const fn = jest.fn().mockReturnValue('sync-data')

    const result = withCache(fn)

    expect(result).toBe('sync-data')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('calls fn for each invocation (no coalescing)', async () => {
    const fn = jest.fn().mockResolvedValue('data')

    const [res1, res2] = await Promise.all([
      withCache(fn, { category: 'auth', keyParts: ['456'] }),
      withCache(fn, { category: 'auth', keyParts: ['456'] }),
    ])

    expect(res1).toBe('data')
    expect(res2).toBe('data')
    // Passthrough means fn is called per-invocation (no single-flight)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
