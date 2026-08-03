# Forced reflow

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />

Published: Oct 8, 2025

<br />

A forced reflow occurs when JavaScript queries geometric properties (such as `offsetWidth`) after styles have been invalidated by a change to the DOM state. This forces the browser to immediately do a layout, which interrupts script execution and results in poor performance.

An example of code that causes forced reflow:

Multiple forced reflows in quick succession is called ["layout thrashing"](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing#avoid_layout_thrashing).

## How to pass this insight

- Avoid, or at least reduce, the amount of DOM geometry writes that are done just before reads.
- Have no forced reflows that take longer than 30 milliseconds.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/ForcedReflow.ts)
- [Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- <https://webperf.tips/tip/layout-thrashing/>
- <https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/EventPhases/explainer.md#how-does-this-happen>
