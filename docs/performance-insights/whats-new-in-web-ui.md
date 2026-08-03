# What's new in web UI

![Bramus](https://web.dev/images/authors/bramus.jpg) Bramus [X](https://twitter.com/bramus) [GitHub](https://github.com/bramus) [Mastodon](https://front-end.social/@bramus) [Bluesky](https://bsky.app/profile/bram.us) [Homepage](https://www.bram.us/) ![Una Kravets](https://web.dev/images/authors/unakravets.jpg) Una Kravets [X](https://twitter.com/una) [Mastodon](https://front-end.social/@una) [Homepage](https://una.im)

<br />

Published: July 1, 2026

<br />

At Google I/O 2026, we shared a whirlwind of updates landing in the Web UI platform. From respecting user preferences to implementing natural interactions, guiding navigation, reducing clutter, and adapting to various form factors, the modern web offers developers incredibly powerful tools to build high-quality, tactile user experiences.
[Video](https://www.youtube.com/watch?v=uT7MVcCQ4rw)

Here is a comprehensive round-up of all the features mentioned in the "What's new in web UI" session, structured by our core set of UX principles.

## Part 1: Respect user preferences

Personalization is fundamental for web usability. Modern web APIs make it easier to adapt to user system-level choices automatically. Even though these concepts feel elemental and we've been talking about them for years, there are actually a few new APIs and patterns that make this dynamic personalization easier to build for.

### 1. `contrast-color()`

The [`contrast-color()`](https://developer.mozilla.org/docs/Web/CSS/contrast-color) CSS function takes an input color and automatically returns either `black` or `white`, depending on which has the higher contrast against the input color based on the WCAG AA minimum contrast algorithm. This ensures legibility without manually maintaining text-background color pairs.

[Learn more about `contrast-color()`](https://goo.gle/contrast-color)

### 2. `light-dark()`

The [`light-dark()`](https://developer.mozilla.org/docs/Web/CSS/light-dark) CSS function lets you specify two different values (colors or images) for a property, one for light mode and one for dark mode, within a single declaration. The browser automatically selects the correct contrast color based on the active `color-scheme` (which must be set to `light`, `dark`, or `light dark` on `:root` or a parent).

New to `light-dark()` is that it is no longer limited to just color values. Starting with Chrome 150, it now also accepts two image values.

- [Learn more about `light-dark()`](https://goo.gle/light-dark)
- [Learn more about `light-dark()` with images](https://goo.gle/light-dark-images)

### 3. CSS custom functions (`@function`)

The [`@function`](https://developer.mozilla.org/docs/Web/CSS/@function) at-rule lets you define custom, reusable functions directly within native CSS. It can accept locally-scoped custom properties as arguments, perform calculations, and return values using the `result` descriptor, reducing the need for preprocessors.

Combined with container style queries and the CSS `if()` function, you can create a custom `--light-dark()` function that works with _any_ type of value.

- [Learn more about `@function`](https://goo.gle/at-function)
- [Learn more about `--light-dark()`](https://goo.gle/custom-light-dark)

### 4. Container style queries

Part of CSS Container Queries, style queries let developers apply styles to descendant elements based on the computed custom property values of a parent container, enabling dynamic components without requiring explicit size containment.

```css
@container style(--theme: primary) {
  .app-card {
    --bg-light: #fdf2f8;
    --bg-dark: #ff91d3;
    --neon-glow: #f472b6;
    --btn-light: #be185d;
    --btn-dark: #fbcfe8;

    --text-on-light: #500732;
    --text-on-dark: #fff1f2;
  }
}

@container style(--theme: accent) {
  .app-card {
    --bg-light: #f3e8ff;
    --bg-dark: #4c1d95;
    --neon-glow: #d8b4fe;
    --btn-light: #7e22ce;
    --btn-dark: #c084fc;

    --text-on-light: #2e1065;
    --text-on-dark: #faf5ff;
  }
}
```

[Learn more about style queries](https://goo.gle/style-queries)

### 5. CSS `if()` function

The [`if()`](https://developer.mozilla.org/docs/Web/CSS/if) CSS function brings inline conditional logic directly to CSS property values. It evaluates a series of semicolon-separated conditions (style queries, media queries, or feature queries) and lets you set different values associated with the first true condition, with an optional `else` fallback.

```css
--contrast-color: contrast-color(var(--card-bg));
color: if(style(--contrast-color: white): var(--text-on-dark) ; else: var(--text-on-light));
```

### 6. `@supports at-rule()`

The CSS `at-rule()` function for use with `@supports` allows developers to feature-detect whether a browser recognizes a specific at-rule, such as `@starting-style` or `@view-transition`.

For example, to check for support for `@function`, use it as follows:

```css
@supports at-rule(@function) {
  /* Code for browsers that support @function goes here */
}
```

Using `at-rule()` only allows checking for base support of the at-rule itself and cannot be used to test for specific descriptors, preludes, or full at-rule blocks.

[Learn more about `@supports at-rule`](https://goo.gle/at-rule)

### 7. `<meta name="text-scale">`

The [`text-scale`](https://developer.mozilla.org/docs/Web/HTML/Element/meta/name/text-scale) HTML meta tag opts the page in to having the `<html>` root element's initial font size scale in proportion to OS and browser-level text scale settings, which is especially critical for mobile platforms.

When applied, the font-size on the `html` element is now determined by the operating system, so there is no need for you to set a base `font-size`. If you then use lengths with relative units like `em` and `rem`, the computed pixel values are based off of that base font-size.

```html
<meta name="text-scale" value="scale" />
```

[Learn more about `<meta name=text-scale>`](https://goo.gle/meta-text-scale)

---

## Part 2: Implement natural interactions

Intuitive, physical motion and natural gestures are key to making web experiences feel as tactile as native applications. And modern CSS makes this easier for you to achieve.

### 8. `linear()` easing function

The [`linear()`](https://developer.mozilla.org/docs/Web/CSS/easing-function/linear) easing function lets you create complex, custom transition curves (like bounces, springs, or elastic overshoots) by interpolating linearly between an unlimited number of specified progress points.

[Learn more about `linear()`](https://goo.gle/css-linear-function)

### 9. `@starting-style`

The [`@starting-style`](https://developer.mozilla.org/docs/Web/CSS/@starting-style) CSS at-rule defines the starting values for properties on an element that you want to transition from when the element is first rendered in the DOM or when its `display` changes from `none` to a visible value, to enable smooth entry transitions.

### 10. `transition-behavior: allow-discrete`

The [`transition-behavior`](https://developer.mozilla.org/docs/Web/CSS/transition-behavior) property (often used as `allow-discrete` in the `transition` shorthand) lets you transition discrete properties like `display` or `overlay`, ensuring elements remain visible during exit animations before being hidden.

> [!NOTE]
> **Note:** To learn more about animations, starting-style, easings, and more, check out [Web animations today and tomorrow](https://goo.gle/web-animations-today-and-tomorrow) by Bramus, as presented at Google I/O 2025.

### 11. `sibling-index()` and `sibling-count()`

The [`sibling-index()`](https://developer.mozilla.org/docs/Web/CSS/sibling-index) and [`sibling-count()`](https://developer.mozilla.org/docs/Web/CSS/sibling-count) CSS functions return integers representing an element's 1-based position among its siblings and the total sibling count, respectively. They are perfect for calculating staggered animation delays dynamically in CSS without JavaScript.

```css
dialog[open] > * {
  animation: content-entry 0.6s var(--spring) forwards;

  /* 0.2s delay for the first item, then staggering by 0.05s via sibling-index() */
  animation-delay: calc(sibling-index() * 0.05s + 0.2s);
}
```

### 12. Dialog light dismiss (`closedby` attribute)

The [`closedby`](https://developer.mozilla.org/docs/Web/API/HTMLDialogElement/closedBy) attribute on the `<dialog>` element (with value `any`) lets you use declarative "light dismiss" behavior, automatically closing modal dialogs when clicking outside them or pressing <kbd>ESC</kbd>, without requiring custom JavaScript.

### 13. `corner-shape`

The experimental [`corner-shape`](https://developer.mozilla.org/docs/Web/CSS/corner-shape) shorthand property lets developers modify rounded corners (from `border-radius`) to create custom visual shapes like `bevel`, `scoop`, `notch`, or `squircle` (via `superellipse()`). Borders, shadows, and focus outlines automatically conform to the shape.

---

## Part 3: Provide guided navigation

Guiding the user journey helps maintain context and understand the application's flow, eliminating disorienting reloads.

### 14. Same-document view transitions

Part of the [View Transition API](https://developer.mozilla.org/docs/Web/API/View_Transition_API), same-document transitions provide a mechanism for animating between DOM states in single-page applications (SPAs) by capturing snapshots and transitioning them using CSS.

[Learn more about same-document view transitions](https://goo.gle/same-document-view-transitions)

### 15. Cross-document view transitions

Extends the View Transition API to multi-page applications (MPAs), letting you create seamless, animated transitions when navigating between different documents by matching elements with the same `view-transition-name` across pages.

[Learn more about cross-document view transitions](https://goo.gle/cross-document-view-transitions)

### 16. Element-scoped view transitions

Introduced in Chrome 147, [element-scoped view transitions](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions) let you run a view transition only on a specific DOM subtree (using `element.startViewTransition()`) while keeping the rest of the page active and interactive.

When starting an element-scoped view transition, it runs in isolation: it only scans that subtree for elements with a `view-transition-name` and the `::view-transition` pseudo gets injected onto the scope root itself. The isolation is possible thanks to the automatic application of `view-transition-scope: all`.

This allows multiple view transitions to run at the same time, as well as the nesting of view transitions.

[Learn more about element-scoped view transitions](https://goo.gle/element-scoped-view-transitions)

### 17. Two-phase view transitions

This is an experimental feature that immediately starts a cross-document view transition without waiting for the new DOM to be ready, first transitioning into an intermediary skeleton screen or loading UI, before continuing with the cross-document view transition.

[Learn more about two-phase view transitions](https://goo.gle/two-phase-view-transitions-explainer)

### 18. Scroll-driven animations

[Scroll-driven animations](https://developer.mozilla.org/docs/Web/CSS/Guides/Scroll-driven_animations) link the progress of a CSS animation directly to the scroll position of a scroll container, letting developers build scroll-based interfaces like efficient parallax effects and scroll indicators.

- [Learn more about scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [Check out multiple scroll-driven animations demos](https://scroll-driven-animations.style/)
- [Learn scroll-driven animations with this 10-part free video course](https://scroll-driven-animations.style/#learn)

### 19. Scroll-triggered animations

New to Chrome are scroll-**triggered** animations. [Scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations) trigger a standard time-based CSS animation when a scroll boundary is crossed (using `timeline-trigger` to define the trigger and `animation-trigger` to play it), providing a declarative alternative to `IntersectionObserver`.

```css
.element {
  timeline-trigger: --t view() contain 25% contain 75% / entry 105% exit -5%;
}
```

[Learn more about scroll-triggered animations](https://goo.gle/scroll-triggered-animations)

### 20. `scroll-target-group: auto`

You can now build a native CSS scroll-spy which automatically highlights navigation links based on the user's scroll position. By setting [`scroll-target-group: auto`](https://developer.mozilla.org/docs/Web/CSS/scroll-target-group) on a navigation list, the browser automatically sets `aria-current="true"` and applies the `:target-current` pseudo-class to the active link. `:target-current` can then be used to further style the active links.

[Learn more about the CSS scroll-spy with `scroll-target-group`](https://goo.gle/css-scrollspy)

### 21. `scrollIntoView()` container option

The [`scrollIntoView()`](https://developer.mozilla.org/docs/Web/API/Element/scrollIntoView) method gains a `container` option. Setting `target.scrollIntoView({container: 'nearest'})` limits the scrolling to the nearest ancestor scroller instead of having it bubble all the way up, preventing disorienting page-level scrolling.

[Learn more about `container: "nearest"`](https://goo.gle/scrollintoview-container)

### 22. Awaitable programmatic scrolling

All programmatic scroll methods (like `scroll()`, `scrollTo()`, and `scrollIntoView()`) now return a Promise. This lets developers `await` the completion of smooth scroll animations before executing subsequent logic (like adding a highlight effect).

---

## Part 4: Maximize content, reduce noise

One of the most frustrating web experiences is expecting to see content and getting blocked by intrusive pop ups or banners. Prioritize content area by eliminating visual clutter and application borders, moving secondary actions behind layered UI.

### 23. Scroll-state queries (`scrolled`)

Part of CSS Container Queries, `scroll-state` queries let you style descendants based on the scroll state of a container (with `container-type: scroll-state`). The [`scrolled` query](https://developer.chrome.com/blog/css-scroll-state-queries) (for example, `scroll-state(scrolled: bottom)`) detects the direction of the most recent relative scroll, enabling patterns like the "Hidey Bar."

[Learn more about the "Hidey Bar" pattern](https://goo.gle/hidey-bar)

### 24. Anchored container queries

CSS Anchor Positioning includes [anchored container queries](https://developer.mozilla.org/docs/Web/CSS/Guides/Anchor_positioning/Anchored_container_queries), which let you check which fallback position (for example, `fallback: bottom` or `fallback: flip-block`) is currently active on an anchor-positioned element, enabling dynamic updates to styling an anchor positioned element (like tooltip arrows).

### 25. CSS `border-shape`

The [`border-shape`](https://developer.chrome.com/blog/css-shape) property lets you define non-rectangular borders using the same shape syntax as `clip-path`. Unlike clipping, `border-shape` keeps borders, outlines, and shadows visually aligned with the custom shape. It also goes beyond the capabilities of `corner-shape`, as `border-shape` is much more flexible.

### 26. CSS `shape()` function

The CSS `shape()` function lets you define complex geometric paths inline in CSS. It can be used with properties like `clip-path`, `border-shape`, or `shape-outside` to create organic, non-rectangular shapes that content can float against.

### 27. Sticky positioning per axis

Thanks to a recent change in the overflow specification that allows containers to be a scroller for only a single axis, sticky positioning can now track two different scroll containers (one for each axis) simultaneously. This makes a sticky first column and top row in a table work as expected even inside single-axis scroll containers.

[Learn more about `position: sticky` per axis](https://goo.gle/sticky-per-axis)

---

## Part 5: Adapt to the form factor

One of the most valuable things about the web is its flexibility. Users can navigate the web from a variety of devices, each with their own interaction mechanisms. Layouts should fundamentally adapt to the device and input method.

### 28. Overscroll gestures (swipeable areas)

The Chrome team is working on a proposed declarative solution, in discussion with OpenUI community group, that lets you create native, gesture-driven swipeable areas (for example, swipeable Gmail lists or swipe-dismiss side menus) using `overscrollcontainer` and command invokers, working across touch and scroll naturally.

[Learn more about overscroll gestures](https://goo.gle/overscroll-gestures-open-ui)

### 29. HTML-in-Canvas

The [HTML-in-Canvas API](https://developer.chrome.com/blog/html-in-canvas-origin-trial) is a major paradigm shift, letting developers place real DOM elements inside a `<canvas>` (using the `layoutsubtree` attribute). These elements remain fully searchable, accessible, and support browser features like autofill, while letting WebGL/WebGPU shaders interact with them natively.

- [Learn more about HTML-in-Canvas](https://developer.chrome.com/blog/html-in-canvas-origin-trial)
- [Explore HTML-in-Canvas demos](https://goo.gle/html-in-canvas-demos)

---

## Lightning round

A quick-fire look at some other powerful features pushing the web forward.

### 30. DOM state-preserving move (`moveBefore()`)

The [`moveBefore()`](https://developer.mozilla.org/docs/Web/API/Element/moveBefore) DOM method lets you reparent DOM nodes (for example, playing videos, iframes, or focused inputs) without destroying their state or triggering reloads.

[Learn more about `moveBefore()`](https://goo.gle/movebefore)

### 31. CSS `text-fit`

`text-fit` is an experimental CSS property that dynamically scales font-size to precisely fit lines of text to the exact width of their containing element (for example, `text-fit: grow per-line-all`).

[Learn more about `text-fit`](https://goo.gle/css-fit-width-text-explainer)

### 32. CSS `text-box` (`text-box-trim` and `text-box-edge`)

The [`text-box`](https://developer.mozilla.org/docs/Web/CSS/text-box) property (and its longhands `text-box-trim` and `text-box-edge`) trims the vertical space (leading) above and below text, ensuring perfect vertical alignment and centering.

[Learn more about `text-trim`](https://goo.gle/css-text-box)

### 33. CSS gap decorations

CSS gap decorations bring [`column-rule`](https://developer.mozilla.org/docs/Web/CSS/column-rule) to grid and flexbox, and introduce a new `row-rule` property, letting developers style the gutters between rows and columns.

[Learn more about CSS Gap Decorations](https://goo.gle/css-gap-decorations)

### 34. Scrollbar-aware viewport units (`vw`, `vh`, etc.)

Viewport units like `vw` and `vh` automatically subtract the size of scrollbars (if guaranteed to be visible, using `overflow-y: scroll` or `scrollbar-gutter: stable` declared on `:root`), preventing accidental horizontal overflow when setting elements to `100vw`.

[Learn more about scrollbar-aware viewport units](https://goo.gle/scrollbar-aware-viewport-units)

### 35. JavaScript access to pseudo-elements

Web APIs now expose CSS pseudo-elements (like `::before` or `::after`) to JavaScript. You can retrieve a `CSSPseudoElement` instance using `Element.pseudo(type)` and check which pseudo-element triggered an event using `Event.pseudoTarget`.

[Learn more about `CSSPseudoElement`](https://goo.gle/csspseudoelement-explainer)

## Conclusion

That's it for our roundup of _What's New in Web UI_. We hope you take these features and build some great interfaces with them. Until next year!
