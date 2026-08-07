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
    const fetcher = jest.fn()
      .mockResolvedValueOnce('data-1')
      .mockResolvedValueOnce('data-2')

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
})
