# Render-blocking requests

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />


Published: Oct 8, 2025

<br />

Requests are blocking the page's initial render, which may delay LCP. Deferring or inlining can move these network requests out of the critical path.

## How to pass this insight

This insight highlights requests that prevented the first paint of the page. To pass this insight, remove all such render-blocking requests.

Some strategies for reducing the impact of render-blocking requests include:

- Defer requests that are not needed for first-paint.
- Inline requests that are critical for first-paint, but small.
- Reduce the content of CSS or scripts to just what is necessary for the first paint.

> [!IMPORTANT]
> **Important:** Inlining CSS is an advanced performance technique that can improve performance, but can also lead to bugs if not implemented properly. **Most sites should be able to achieve all of our recommended performance targets without implementing this technique.**

## Stack-specific guidance

This insight also offers stack-specific guidance for pages using the following technologies:

### AMP

Use tools such as [AMP Optimizer](https://github.com/ampproject/amp-toolbox/tree/master/packages/optimizer)
to [server-side render AMP layouts](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/server-side-rendering/).

### Drupal

Consider using [a module](https://www.drupal.org/project/critical_css) to inline critical CSS and JavaScript, and use the defer attribute for non-critical CSS or JavaScript.

### Joomla

There are a number of Joomla plugins that can help you [inline critical assets](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=performance)
or [defer less important resources](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=performance).

### WordPress

 There are a number of WordPress plugins that can help you [inline critical assets](https://wordpress.org/plugins/search/critical+css/) or [defer less important resources](https://wordpress.org/plugins/search/defer+css+javascript/).

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/RenderBlocking.ts)
- [Understand the critical path - Render-blocking resources](https://web.dev/learn/performance/understanding-the-critical-path#render-blocking_resources)
- [Coverage: Find unused JavaScript and CSS](https://developer.chrome.com/docs/devtools/coverage)
- [Remove unused code](https://web.dev/articles/remove-unused-code)
- [Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css)
- [Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [JavaScript Start-up Optimization](https://web.dev/articles/optimizing-content-efficiency-javascript-startup-optimization)
