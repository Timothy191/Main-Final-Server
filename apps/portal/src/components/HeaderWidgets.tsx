'use client'

import { lazy, Suspense } from 'react'

const WeatherWidget = lazy(() =>
  import('@/components/weather/WeatherWidget').then((m) => ({
    default: m.WeatherWidget,
  }))
)

const SystemClock = lazy(() =>
  import('@/components/clock/SystemClock').then((m) => ({
    default: m.SystemClock,
  }))
)

const ServicesDropdown = lazy(() =>
  import('@/components/nav/ServicesDropdown').then((m) => ({
    default: m.ServicesDropdown,
  }))
)

/**
 * HeaderWidgets
 *
 * Groups the weather widget, system clock, and services dropdown into a single
 * lazy-loaded chunk. This keeps the main layout JS lean — these three widgets
 * are loaded only when the page is idle (via Suspense + browser idle pattern).
 *
 * Each widget renders a minimal skeleton placeholder until its code arrives.
 */
function WidgetFallback({ width = 'w-7' }: { width?: string }) {
  return (
    <div
      className={`${width} h-7 rounded-full bg-black/[0.03] border border-border-subtle animate-pulse`}
      aria-hidden="true"
    />
  )
}

export function HeaderWidgets() {
  return (
    <>
      <Suspense fallback={<WidgetFallback />}>
        <WeatherWidget variant="header" />
      </Suspense>

      <Suspense fallback={<WidgetFallback width="w-20" />}>
        <SystemClock />
      </Suspense>

      <Suspense fallback={<WidgetFallback />}>
        <ServicesDropdown />
      </Suspense>
    </>
  )
}
