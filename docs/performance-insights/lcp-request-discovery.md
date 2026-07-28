# LCP request discovery

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />


Published: Oct 8, 2025

<br />

Optimize LCP by making the LCP image discoverable from the HTML immediately, prioritizing it, and avoiding lazy-loading.

## How to pass this insight

If a page's LCP is an image:

- Use `fetchpriority=high` on the image element, or on its preload directive.
- Ensure the image is discoverable from the main document (either because it is directly in the HTML, or the image is preloaded).
- Avoid `loading=lazy` for the image.

> [!IMPORTANT]
> **Important:** When preloading the image, ensure `fetchpriority=high` is set on the preload as well as the image.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/LCPDiscovery.ts)
- [Optimize Largest Contentful Paint - Eliminate resource load delay](https://web.dev/articles/optimize-lcp#1_eliminate_resource_load_delay)
- [The performance effects of too much lazy loading](https://web.dev/articles/lcp-lazy-loading)
