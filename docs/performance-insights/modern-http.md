# Modern HTTP

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />


Published: Oct 8, 2025

<br />

HTTP/2 and HTTP/3 offer many benefits over HTTP/1.1, such as multiplexing.

> [!IMPORTANT]
> **Important:** This insight isn't available in [PageSpeed Insights](https://pagespeed.web.dev).

## How to pass this insight

Configure your server to use HTTP/2 or HTTP/3.

Some resources are excluded from consideration in this insight. This insight will only consider resources that are:

- Served over HTTP/1.1 or earlier.
- Served over an origin that serves at least 6 static asset requests (if there aren't more requests than browser's max/host, multiplexing isn't as big a deal).
- Not served on localhost (modern versions of HTTP are often not supported locally and in CI, so this insight ignores local web servers).

See the insight source code for more details.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/ModernHTTP.ts)
- [Introduction to HTTP/2](https://web.dev/articles/performance-http2)
- [HTTP/2 Frequently Asked Questions](https://http2.github.io/faq/)
