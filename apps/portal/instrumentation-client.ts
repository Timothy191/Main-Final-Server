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
