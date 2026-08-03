---
title: Layout Stability, Script Strategies & Telemetry
tags: [patterns, nextjs16, cls, optimization, scripts, telemetry]
updated: 2026-07-22
source_agent: antigravity
status: active
---

# Layout Stability, Script Strategies & Telemetry

## 1. Layout Stability & Cumulative Layout Shift (CLS)
Based on WICG Layout Instability specifications, Next.js optimizes loading layout shifts:
- **`next/font`**: Automatically matches fallback system font dimensions to the custom web font when it swaps, preventing layout reflow.
- **`next/image`**: Always define explicit `width`/`height` or use `fill` with a relative parent container to reserve space before image fetch completes.
- **Loading Skeletons**: Specify heights (e.g. `h-[200px]`) on Suspense skeleton fallbacks for dynamic components to prevent document shift during client-side hydration.

## 2. Script Strategies (`next/script`)
To maximize thread concurrency:
- **Strategies**: Use `afterInteractive` (default) for standard trackers, `beforeInteractive` only for critical inline hooks/shims, and `lazyOnload` for non-critical widgets.
- **Web Workers (`strategy="worker"`)**: Offloads script execution to Partytown (experimental).
- **Inline Tracking**: Inline scripts must specify a unique `id` prop for Next.js to compile and bundle them correctly.

## 3. Web Vitals & Client Telemetry
Measure and capture page performance using Next.js Speed Insights APIs:
- **`useReportWebVitals`**: Place in a Client Component to capture Core Web Vitals (FCP, LCP, CLS, INP).
- **Client Instrumentation**: Use `instrumentation-client.ts` at the application root for error capturing and third-party setups running before the app executes.
- **Data Beaconing**: Always use `navigator.sendBeacon` if available, falling back to `fetch` with `keepalive: true` to prevent blocking route transition.

## Evidence & Citation
Configured and detailed in `.next.js/layout-instability.md`, `.next.js/image.md`, `.next.js/script.md`, and `.next.js/analytics.md`.
