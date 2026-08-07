import { renderHook, act } from '@testing-library/react'
import {
  useControlRoomCache,
  invalidateClientCacheByTags,
  _clientCacheStoreForTesting,
} from './useControlRoomCache'

describe('useControlRoomCache', () => {
  beforeEach(() => {
    _clientCacheStoreForTesting.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should fetch data on initial render', async () => {
    const fetcher = jest.fn().mockResolvedValue('fresh-data')
    const { result } = renderHook(() => useControlRoomCache('key-1', fetcher))

    // Initial state: data is null, isValidating is true
    expect(result.current.data).toBeNull()
    expect(result.current.isValidating).toBe(true)

    // Resolve fetcher
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })

    expect(result.current.data).toBe('fresh-data')
    expect(result.current.isValidating).toBe(false)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('should return cached data immediately if not expired', async () => {
    const fetcher1 = jest.fn().mockResolvedValue('data-1')
    const fetcher2 = jest.fn().mockResolvedValue('data-2')

    // First render/fetch
    const { result: result1 } = renderHook(() => useControlRoomCache('key-shared', fetcher1))
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(result1.current.data).toBe('data-1')

    // Second render/fetch with same key
    const { result: result2 } = renderHook(() => useControlRoomCache('key-shared', fetcher2))
    expect(result2.current.data).toBe('data-1') // Immediately cached

    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(result2.current.data).toBe('data-1')
    expect(fetcher2).not.toHaveBeenCalled()
  })

  it('should fetch fresh data if cached data is expired', async () => {
    const fetcher1 = jest.fn().mockResolvedValue('data-1')
    const fetcher2 = jest.fn().mockResolvedValue('data-2')

    // Render with 5 second TTL
    const { result: _result } = renderHook(() =>
      useControlRoomCache('key-expired', fetcher1, { ttlSeconds: 5 })
    )
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })

    // Advance time past TTL (6 seconds)
    act(() => {
      jest.advanceTimersByTime(6000)
    })

    // Render again with new fetcher
    const { result: result2 } = renderHook(() =>
      useControlRoomCache('key-expired', fetcher2, { ttlSeconds: 5 })
    )
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })

    expect(result2.current.data).toBe('data-2')
    expect(fetcher2).toHaveBeenCalledTimes(1)
  })

  it('should invalidate cache when tag is invalidated', async () => {
    const fetcher1 = jest.fn().mockResolvedValue('data-1')
    const fetcher2 = jest.fn().mockResolvedValue('data-2')

    // Render with tags
    const { result: _result } = renderHook(() =>
      useControlRoomCache('key-tag-test', fetcher1, { tags: ['scada', 'control'] })
    )
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })

    // Invalidate the tag
    act(() => {
      invalidateClientCacheByTags(['scada'])
    })

    // Next render should fetch fresh data
    const { result: result2 } = renderHook(() =>
      useControlRoomCache('key-tag-test', fetcher2, { tags: ['scada', 'control'] })
    )
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })

    expect(result2.current.data).toBe('data-2')
    expect(fetcher2).toHaveBeenCalledTimes(1)
  })

  it('should force refresh when calling refresh()', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce('data-1').mockResolvedValueOnce('data-2')

    const { result } = renderHook(() => useControlRoomCache('key-refresh', fetcher))
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(result.current.data).toBe('data-1')

    // Trigger manual/forced refresh
    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.data).toBe('data-2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('should leave unrelated entries after invalidating a tag (Scenario 2.2)', async () => {
    const fetcherA = jest.fn().mockResolvedValue('data-a')
    const fetcherB = jest.fn().mockResolvedValue('data-b')

    // Populate the cache with two keys carrying disjoint tag sets.
    const { result: resultA } = renderHook(() =>
      useControlRoomCache('key-a', fetcherA, { tags: ['scada'] })
    )
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(resultA.current.data).toBe('data-a')

    const { result: resultB } = renderHook(() =>
      useControlRoomCache('key-b', fetcherB, { tags: ['engineering'] })
    )
    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(resultB.current.data).toBe('data-b')

    // Invalidate only the 'scada' tag — the 'engineering'-tagged entry must survive.
    act(() => {
      invalidateClientCacheByTags(['scada'])
    })

    expect(_clientCacheStoreForTesting.has('key-a')).toBe(false)
    expect(_clientCacheStoreForTesting.has('key-b')).toBe(true)
    // The unrelated entry is still served from cache.
    expect(resultB.current.data).toBe('data-b')
  })

  it('should not refetch or loop when fetcher is recreated every render (Scenario 3.1)', async () => {
    // Each render produces a BRAND-NEW fetcher closure for the same cache key.
    // The hook must pin the fetcher in a ref and must NOT refetch (or loop)
    // merely because the fetcher identity changed.
    let callCount = 0
    const makeFetcher = () => async () => {
      callCount += 1
      return `volatile-${callCount}`
    }

    const { result, rerender } = renderHook(
      ({ fetcher }) => useControlRoomCache('key-volatile', fetcher),
      { initialProps: { fetcher: makeFetcher() } }
    )

    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(result.current.data).toBe('volatile-1')
    expect(callCount).toBe(1)

    // Re-render several times, each with a NEW fetcher closure (same key).
    rerender({ fetcher: makeFetcher() })
    rerender({ fetcher: makeFetcher() })
    rerender({ fetcher: makeFetcher() })

    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })

    // No refetch triggered by volatile fetcher references; the data and the
    // cached store entry are unchanged after the re-renders.
    expect(callCount).toBe(1)
    expect(result.current.data).toBe('volatile-1')
    expect(_clientCacheStoreForTesting.has('key-volatile')).toBe(true)
  })

  it('should auto-resume (retry) after an error once the retry delay elapses', async () => {
    // First call throws; subsequent calls succeed. This models a transient
    // downstream failure that the hook should recover from on its own.
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce('recovered-data')

    const { result } = renderHook(() =>
      useControlRoomCache('key-retry', fetcher, { retryDelayMs: 10_000 })
    )

    // Initial attempt fails -> error surfaced; the retry timer is pending but
    // has NOT fired yet (flush microtasks only, do not run timers).
    await act(async () => {})
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Before the delay elapses, no retry has fired.
    act(() => {
      jest.advanceTimersByTime(9_999)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // After the 10s delay elapses, the background retry fires and succeeds.
    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe('recovered-data')
  })

  it('should not auto-retry when retryDelayMs is 0', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('persistent failure'))

    const { result } = renderHook(() =>
      useControlRoomCache('key-no-retry', fetcher, { retryDelayMs: 0 })
    )

    await act(async () => {
      await jest.runOnlyPendingTimersAsync()
    })
    expect(result.current.error).toBeInstanceOf(Error)
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Even after a long wait, no retry is scheduled.
    act(() => {
      jest.advanceTimersByTime(60_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
