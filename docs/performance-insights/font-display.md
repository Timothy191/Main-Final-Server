# Font display

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />

Published: Oct 8, 2025

<br />

Consider setting [`font-display`](https://developer.mozilla.org/docs/Web/CSS/@font-face/font-display) to `swap` or `optional` to ensure text is consistently visible. `swap` can be further optimized to mitigate layout shifts with [font metric overrides](https://developer.chrome.com/blog/font-fallbacks).

## How to pass this insight

Set `font-display` to either `swap` or `optional` to pass this insight.

## Stack-specific guidance

This insight also offers stack-specific guidance for pages using the following technologies:

### Drupal

Specify `@font-display` when defining custom fonts in your theme.

### Magento

Specify `@font-display` when [defining custom fonts](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/css-topics/using-fonts.html).

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/FontDisplay.ts)
- [Controlling font performance with font displays](https://developer.chrome.com/blog/font-display)
- [Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks)
- [Avoid invisible text during loading](https://web.dev/articles/font-best-practices)
- [Preload web fonts to improve loading speed (codelab)](https://web.dev/articles/codelab-preload-web-fonts)
- [Prevent layout shifting and flashes of invisible text (FOIT) by preloading optional fonts](https://web.dev/articles/preload-optional-fonts)
