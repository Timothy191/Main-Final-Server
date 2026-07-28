# Use efficient cache lifetimes

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />


Published: Oct 8, 2025

<br />

A long cache lifetime can speed up repeat visits to your page.

When a browser requests a resource, the server providing the resource can tell the browser how long it should temporarily cache it. For any subsequent request for that resource, the browser uses its local copy rather than gets it from the network.

[Latency matters](https://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) far more than bandwidth to web performance, so avoiding network latency for key requests can dramatically improve user-perceived performance.

## How to pass this insight

All cacheable subresource requests should have a cache lifetime of at least 30 days (2592000 seconds). We believe all static assets should follow the [decision tree outlined here](https://web.dev/articles/http-cache#flowchart): cacheable resources should have a very long lifetime (30 days or 1 year).

A request is considered cacheable if:

- The resource is a font, image, media file, script, or style sheet.
- The resource has a 200, 203, or 206 [HTTP status code](https://developer.mozilla.org/docs/Web/HTTP/Status).
- The resource response headers don't explicitly exclude it from caching (for example: `no-cache, must-revalidate, no-store`).

Learn how to cache resources in [The HTTP cache: your first line of defense guide](https://web.dev/articles/http-cache) and [Configuring HTTP caching behavior codelab](https://web.dev/articles/codelab-http-cache).

Use the **Network** panel in Chrome DevTools to [verify Cache-Control headers](https://developer.chrome.com/docs/devtools/network#search) are set as expected. Additionally, the `Size` column in the **Network** panel indicates if a request was actually served from cache.

## Stack-specific guidance

This insight also offers stack-specific guidance for pages using the following technologies:

### Drupal

Set the **Browser and proxy cache maximum age** in the **Administration \>\> Configuration \>\> Development** page. Read about [Drupal cache and optimizing for performance](https://www.drupal.org/docs/8/api/cache-api/cache-api).

### Joomla

See [Cache](https://docs.joomla.org/Cache).

### WordPress

See [Browser Caching](https://wordpress.org/support/article/optimization/#browser-caching).

## Additional references

- [Cache insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/Cache.ts)
- [Cache-Control specification](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9)
- [Cache-Control (MDN)](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control)
