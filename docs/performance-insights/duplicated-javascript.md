# Duplicated JavaScript

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />


Published: Oct 8, 2025

<br />

Remove large, duplicate JavaScript modules from bundles to reduce unnecessary bytes consumed by network activity.

## How to pass this insight

- For pages with multiple JavaScript bundles, code splits large dependencies needed by multiple bundles to a common bundle.
- Within individual JavaScript bundles, ensure there is only one version of large dependencies.

You can dive deeper into the JavaScript bundles on a page by clicking the `View Treemap`. This opens the page's bundles in the Lighthouse Treemap.

![Lighthouse Treemap. The colored nodes represent duplicate modules found across multiple JavaScript bundles](https://developer.chrome.com/static/docs/performance/insights/duplicated-javascript/image/lighthouse-treemap.png) Lighthouse Treemap. The colored nodes represent duplicate modules found across multiple JavaScript bundles.

- In PageSpeed Insights and in the Lighthouse report, this button is in the Performance category below the metrics:

  ![Lighthouse View Treemap button](https://developer.chrome.com/static/docs/performance/insights/duplicated-javascript/image/lighthouse-view-treemap-button.png) Lighthouse "View Treemap" button.
- In the DevTools **Performance** Panel, this button is in the **Duplicated JavaScript** insight:

  ![DevTools Performance Panel View Treemap button](https://developer.chrome.com/static/docs/performance/insights/duplicated-javascript/image/performance-panel-treemap-button.png) DevTools Performance Panel "View Treemap" button.

## Stack-specific guidance

Create an additional entry point for common, large dependencies and enable your JavaScript bundler's code splitting feature for the following:

- [webpack](https://webpack.js.org/guides/code-splitting/)
- [rollup](https://rollupjs.org/tutorial/#code-splitting)
- [esbuild](https://esbuild.github.io/api/#splitting)
- [Parcel](https://parceljs.org/features/code-splitting/)

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/DuplicatedJavaScript.ts)
