'use client'

/**
 * WeatherWidget — minimal stub.
 * Displays current weather conditions in the header.
 * Full implementation pending with OpenWeatherMap API integration.
 */
export function WeatherWidget({ variant: _variant = 'header' }: { variant?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/[0.03] border border-arch-border-subtle text-xs text-arch-text-tertiary">
      <span aria-hidden="true">☀️</span>
      <span>24°C</span>
    </div>
  )
}
