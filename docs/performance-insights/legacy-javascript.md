# Legacy JavaScript

![Connor Clark](https://web.dev/images/authors/cjamcl.jpg) Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark) ![Jeremy Wagner](https://web.dev/images/authors/jlwagner-v7.jpg) Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)

<br />

Published: Apr 29, 2026

<br />

Polyfills and transforms let you use features that may not be [Baseline](https://web.dev/baseline)---also known as **Limited availability** features. Baseline doesn't discourage you from using Limited availability features, but features which are either Baseline Newly or Widely available can often be used without them. The Legacy JavaScript audit lets you know where there are opportunities to improve performance by adopting features which are Baseline.

Consider modifying your JavaScript build process to not transpile [Baseline](https://web.dev/articles/baseline-and-polyfills) features, unless you know you must support older browsers.

## How to pass this insight

This insight fails if more than 5 KiB of polyfills or transforms are detected for JavaScript features that are widely supported according to Baseline. To pass this insight, you'll likely need to configure your bundler toolchain to avoid certain pitfalls.

### Use ES6 in production

ES6 is broadly supported in all browsers. If you're using a combination of a module bundler and a JavaScript transpiler---such as [Babel](https://babeljs.io/) and its [`@babel/preset-env` preset](https://babeljs.io/docs/babel-preset-env). The vast majority of websites [do not need](https://philipwalton.com/articles/the-state-of-es5-on-the-web/) to support older, ES5-only browsers.

A common tool used with bundlers and Babel is [Browserslist](https://browsersl.ist/), which accepts a variety of queries specified in natural language, which are then translated to a list of targeted browser environments. For example, you can target Baseline Widely available features with this Browserslist query anywhere a Browserslist config can be found:

```
baseline widely available
```

> [!NOTE]
> **Note:** There are additional, more specific Baseline queries you can use in your project, including targeting by Baseline years---for example, `baseline 2024` and others. Learn more about how to [use Baseline with Browserslist](https://web.dev/articles/use-baseline-with-browserslist). A [Baseline and Browserslist codelab](https://codelabs.developers.google.com/codelabs/use-baseline-in-your-project#0) is available as well.

Baseline Widely available is a suggested default for new web projects. As always, however, you should evaluate the browsers used to access your website. One such tool for this is the [Google Analytics Baseline Checker](https://chrome.dev/google-analytics-baseline-checker/).

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/LegacyJavaScript.ts)
- [Baseline](https://web.dev/baseline)
- [How to think about Baseline and polyfills](https://web.dev/articles/baseline-and-polyfills)
- [The State of ES5 on the Web](https://philipwalton.com/articles/the-state-of-es5-on-the-web/)
- [Use Baseline with Browserslist](https://web.dev/articles/use-baseline-with-browserslist)
- [Baseline and Browserslist Codelab](https://codelabs.developers.google.com/codelabs/use-baseline-in-your-project#0)
- [Google Analytics Baseline Checker](https://chrome.dev/google-analytics-baseline-checker/)
- [`@babel/preset-env`](https://babeljs.io/docs/babel-preset-env)
