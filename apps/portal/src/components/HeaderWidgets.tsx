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

import { ServicesDropdown } from '@/components/nav/ServicesDropdown'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@repo/theme/react'

function HighGlareToggle() {
  const { theme, setTheme } = useTheme()
  const isHighGlare = theme === 'high-glare'

  return (
    <button
      onClick={() => setTheme(isHighGlare ? 'light' : 'high-glare')}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.03] border border-border-subtle hover:bg-black/[0.06] transition-colors"
      title={isHighGlare ? 'Disable High Glare Mode' : 'Enable High Glare Mode'}
    >
      {isHighGlare ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  )
}

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
      <HighGlareToggle />

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
