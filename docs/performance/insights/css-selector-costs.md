# CSS selector costs

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />

Published: Oct 8, 2025

<br />

If **recalculate style** costs remain high, selector optimization can reduce them. Optimize the selectors with both high elapsed time and high slow-path percentages. Simpler selectors, fewer selectors, a smaller DOM, and a shallower DOM will all reduce matching costs.

> [!IMPORTANT]
> **Important:** This insight isn't available in [PageSpeed Insights](https://pagespeed.web.dev).

## How to pass this insight

This insight always passes, but may still show for informational purposes.

It only appears in the DevTools **Performance** panel when the setting **Enable CSS selector stats (slow)** is on.

> [!NOTE]
> **Note:** There is a performance overhead to collecting CSS selector statistics. CSS performance is expected to be better when this setting is not enabled, but you can use this optional insight to discover the worst performing selectors.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/SlowCSSSelector.ts)
- [Analyze CSS selector performance during Recalculate Style events](https://developer.chrome.com/docs/devtools/performance/selector-stats)
- [Reduce the scope and complexity of style calculations](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations)
