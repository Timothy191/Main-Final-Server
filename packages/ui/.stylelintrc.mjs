/**
 * Stylelint config — @repo/ui
 * Inherits the theme package rules and applies them to globals.css.
 */

/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: ["node_modules/**", "dist/**", "coverage/**"],
  rules: {
    // Allow any CSS class pattern (Tailwind arbitrary values use brackets, backslashes, etc.)
    "selector-class-pattern": null,

    // Allow CSS custom properties
    "custom-property-pattern": null,

    // Allow Tailwind at-rules (v3 and v4)
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "layer",
          "variants",
          "responsive",
          "screen",
          "config",
          "plugin",
          "source",
          "theme",
          "utility",
          "custom-variant",
          "custom-media",
          "mixin",
          "define-mixin",
        ],
      },
    ],
    // Tailwind v4 places @import statements after @custom-variant — allow it
    "no-invalid-position-at-import-rule": null,
    // at-rule whitespace — cosmetic
    "at-rule-empty-line-before": null,
    // keyframe to/from is valid CSS
    "keyframe-selector-notation": null,
    // @import "@repo/theme/css" — bare specifiers can't use url() syntax
    "import-notation": null,
    // color-hex-length, custom-property-empty-line-before, property-no-deprecated
    "color-hex-length": null,
    "custom-property-empty-line-before": null,
    "property-no-deprecated": null,

    "selector-pseudo-element-no-unknown": [
      true,
      { ignorePseudoElements: ["global", "local"] },
    ],

    "custom-property-no-missing-var-function": null,
    "color-named": null,
    "color-no-invalid-hex": true,
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "alpha-value-notation": null,
    "property-no-vendor-prefix": null,
    "value-keyword-case": null,
    "property-no-unknown": null,
    "declaration-property-value-no-unknown": null,
    "rule-empty-line-before": null,
    "comment-empty-line-before": null,
  },
};
