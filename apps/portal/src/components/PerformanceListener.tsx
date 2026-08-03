'use client'

import { useEffect } from 'react'
import { useAdaptivePerformance } from '@/hooks/useAdaptivePerformance'

/**
 * PerformanceListener
 *
 * Client-side component that monitors frame render times and applies the
 * `.low-perf-fallback` class to the body element if a performance budget breach occurs.
 */
export function PerformanceListener() {
  const lowPerf = useAdaptivePerformance()

  useEffect(() => {
    if (lowPerf) {
      document.body.classList.add('low-perf-fallback')
    } else {
      document.body.classList.remove('low-perf-fallback')
    }

    return () => {
      document.body.classList.remove('low-perf-fallback')
    }
  }, [lowPerf])

  return null
}
