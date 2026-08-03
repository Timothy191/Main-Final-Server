# INP breakdown

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />

Published: Oct 8, 2025

<br />

This insight presents a breakdown of the longest interaction in terms of three [subparts](https://web.dev/articles/optimize-inp): input delay, processing duration, and presentation delay.

## How to pass this insight

This insight always shows for informational purposes (if INP was measured). It requires some user interaction while recording the trace.

The subpart can help ensure you are optimizing the root cause of slow INP:

- High input delay: the interaction was delayed by other main thread work and may not have been the direct cause of slow INP.
- High processing duration: the interaction event handlers was the direct cause of the slow INP.
  - High presentation delay: there was a rendering delay to display the result of the interaction after the event handler code ran.

Focus on reducing the time of the slowest phase, and try many different user interactions when recording to better understand the biggest contributors of INP for a page.

[Enable CPU throttling](https://developer.chrome.com/docs/devtools/settings/throttling) to better diagnose slow interactions as they might appear on less powerful machines.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/InteractionToNextPaint.ts)
- [Optimize Interaction to Next Paint](https://web.dev/articles/optimize-inp)
- [Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
