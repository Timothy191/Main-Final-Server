# DevTools Performance Insights

This directory contains reference guides and optimization strategies for various DevTools Performance Panel insights.

## Index of Insights

- [3rd parties](third-parties.md) — Reduce and defer third-party code to prioritize page content.
- [CSS Selector Costs](css-selector-costs.md) — Optimize selectors with high elapsed time and slow-path percentages.
- [Declare a character encoding](declare-character-encoding.md) — Ensure character set is declared early to avoid parsing restarts.
- [Duplicated JavaScript](duplicated-javascript.md) — Remove duplicate modules from bundles to reduce network payload.
- [Font display](font-display.md) — Control font loading behavior using `font-display: swap` or `optional`.
- [Forced reflow](forced-reflow.md) — Prevent JavaScript from querying styles/geometry before updates settle.
- [Improve image delivery](improve-image-delivery.md) — Optimize size, compression, and formats for images.
- [INP breakdown](inp-breakdown.md) — Analyze input delay, processing duration, and presentation delay.
- [Layout shift culprits](layout-shift-culprits.md) — Identify and fix elements causing Cumulative Layout Shift (CLS).
- [LCP breakdown](lcp-breakdown.md) — Break down Largest Contentful Paint into key phases (TTFB, load delay, etc.).
- [LCP request discovery](lcp-request-discovery.md) — Make LCP images immediately discoverable in the HTML.
- [Legacy JavaScript](legacy-javascript.md) — Avoid transpiling features that are widely supported in Baseline browsers.
- [Modern HTTP](modern-http.md) — Serve resources over HTTP/2 or HTTP/3 to leverage multiplexing.
- [Network dependency tree](network-dependency-tree.md) — Avoid chaining critical render-blocking requests.
- [Optimize DOM size](optimize-dom-size.md) — Minimize DOM depth and element count to speed up style and layout calculations.
- [Optimize viewport for mobile](optimize-viewport-for-mobile.md) — Set up mobile viewport meta tags to eliminate tap delay.
- [Render-blocking requests](render-blocking-requests.md) — Defer or inline resources blocking the critical rendering path.
- [Throttling](throttling.md) — Set up custom network/CPU throttling in DevTools to test real-world scenarios.
- [Use efficient cache lifetimes](use-efficient-cache-lifetimes.md) — Ensure static resources specify long cache lifetimes.
- [What's new in web UI](whats-new-in-web-ui.md) — Whirlwind of updates landing in the Web UI platform.
