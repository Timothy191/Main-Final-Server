'use client'

import { useReportWebVitals } from 'next/web-vitals'

interface Metric {
  name: string
  value: number
  rating: string
  delta: number
  id?: string
  label?: string
}

/**
 * WebVitalsReporter
 *
 * Reports Core Web Vitals (LCP, CLS, FCP, TTFB, INP) in production.
 * Data is collected and made available via:
 *   - `data-web-vital-*` attributes on <body> for scraping by monitoring
 *   - `sessionStorage` for single-session aggregation
 *   - Console logging in development
 *
 * This is intentionally lightweight — no external dependencies, no backend
 * writes. It collects the data so your observability stack (Grafana,
 * Prometheus, Sentry) can consume it.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric: Metric) => {
    // Dev-mode logging
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      })
      return
    }

    // Production: stamp metric on body for scraping
    const attrName = `data-web-vital-${metric.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    try {
      document.body.setAttribute(attrName, String(metric.value))
    } catch {
      // Silently ignore — attribute setting is non-critical
    }

    // Accumulate in sessionStorage for per-session aggregation
    try {
      const key = `wv:${metric.name}`
      const raw = sessionStorage.getItem(key)
      const entries: Array<{ value: number; rating: string }> = raw ? JSON.parse(raw) : []
      entries.push({ value: metric.value, rating: metric.rating })
      // Keep only last 50 entries per metric
      if (entries.length > 50) entries.shift()
      sessionStorage.setItem(key, JSON.stringify(entries))
    } catch {
      // sessionStorage may be full or unavailable
    }
  })

  return null
}
