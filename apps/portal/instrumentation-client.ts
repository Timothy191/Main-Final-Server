/**
 * Client-side instrumentation file for Next.js 15.3+ / 16.
 * Executes before React hydration begins.
 */

if (typeof window !== 'undefined' && 'performance' in window) {
  performance.mark('portal-init')
}

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Router Transition] ${navigationType} to ${url}`)
  }
}

export function reportWebVitals(metric: {
  id: string
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  label: 'web-vital' | 'custom'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  attribution?: Record<string, unknown>
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`)
  }
  // Send metrics to telemetry route if in production
  if (
    process.env.NODE_ENV === 'production' &&
    typeof window !== 'undefined' &&
    navigator.sendBeacon
  ) {
    const body = JSON.stringify(metric)
    navigator.sendBeacon('/api/telemetry/vitals', body)
  }
}
