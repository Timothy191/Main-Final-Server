# Optimize DOM size

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

<br />


Published: Oct 8, 2025

<br />

A large DOM can increase the duration of style calculations and layouts, [impacting page responsiveness](https://web.dev/articles/dom-size-and-interactivity). A large DOM also increases memory usage.

A deep DOM tree is not a performance issue on its own, however it is a symptom of [design patterns that use unnecessary element nesting](https://web.dev/articles/dom-size-and-interactivity#how_can_i_reduce_dom_size).

This insight considers the entire DOM, including within shadow roots. It ignores DOM nodes that are not also elements. It also ignores `<iframe>` contents.

What to look for:

- **Total elements**: The overall number of elements in your page's DOM.
- **DOM depth**: The maximum depth of the DOM tree.
- **Most children**: The element with the most child elements.

## How to pass this insight

This insight only fails if there is a large layout or style recalculation exceeding a duration of 40ms.

- A *large* layout update involves over 100 layout objects (which are roughly elements).
- A *large* style recalculation affects more than 300 elements.

On failure, in the **Performance** panel, this insight highlights these events in the flame chart.

To reduce the cost of these events:

- Learn how to [measure the cost of CSS selectors and reduce style complexity](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations).
- Minimize the depth of the DOM by reducing unnecessary nesting.
- Consider adopting [Web Components](https://web.dev/articles/web-components) to use the Shadow DOM--while this won't reduce the DOM size, it does reduce the cost of style recalcs.

## Stack-specific guidance

This insight also offers stack-specific guidance for pages using the following technologies:

### Angular

If you're rendering large lists, use [virtual scrolling](https://web.dev/articles/virtualize-lists-with-angular-cdk) with the Component Dev Kit (CDK).

### React

- Use a "windowing" library like [`react-window`](https://web.dev/articles/virtualize-long-lists-react-window) to minimize the number of DOM nodes created if you are rendering many repeated elements on the page.
- Minimize unnecessary re-renders using [`shouldComponentUpdate`](https://reactjs.org/docs/optimizing-performance.html#shouldcomponentupdate-in-action), [`PureComponent`](https://reactjs.org/docs/react-api.html#reactpurecomponent), or [`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo).
- [Skip effects](https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects) only until certain dependencies have changed if you are using the `Effect` hook to improve runtime performance.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/DOMSize.ts)
- [How large DOM sizes affect interactivity, and what you can do about it](https://web.dev/articles/dom-size-and-interactivity)
- [Minimizing browser reflow](https://developers.google.com/speed/docs/insights/browser-reflow)
- [Selector stats in Chrome DevTools](https://developer.chrome.com/docs/devtools/performance/selector-stats)
- [Style invalidation in Blink](https://docs.google.com/document/d/1vEW86DaeVs4uQzNFI5R-_xS9TcS1Cs_EUsHRSgCHGu8/edit)
- [Measure style recalculation time in the field](https://web.dev/articles/find-slow-interactions-in-the-field#expensive_style_and_layout_work)
