import React from 'react'
import { render } from '@testing-library/react'
import { PerformanceListener } from './PerformanceListener'
import { useAdaptivePerformance } from '@/hooks/useAdaptivePerformance'

jest.mock('@/hooks/useAdaptivePerformance', () => ({
  useAdaptivePerformance: jest.fn(),
}))

describe('PerformanceListener', () => {
  beforeEach(() => {
    document.body.className = ''
  })

  it('does not add low-perf-fallback class to body if lowPerf is false', () => {
    ;(useAdaptivePerformance as jest.Mock).mockReturnValue(false)
    render(<PerformanceListener />)
    expect(document.body.classList.contains('low-perf-fallback')).toBe(false)
  })

  it('adds low-perf-fallback class to body if lowPerf is true', () => {
    ;(useAdaptivePerformance as jest.Mock).mockReturnValue(true)
    render(<PerformanceListener />)
    expect(document.body.classList.contains('low-perf-fallback')).toBe(true)
  })

  it('removes low-perf-fallback class on unmount', () => {
    ;(useAdaptivePerformance as jest.Mock).mockReturnValue(true)
    const { unmount } = render(<PerformanceListener />)
    expect(document.body.classList.contains('low-perf-fallback')).toBe(true)
    unmount()
    expect(document.body.classList.contains('low-perf-fallback')).toBe(false)
  })
})
