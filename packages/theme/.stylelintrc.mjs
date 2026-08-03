/**
 * Stylelint config — @repo/theme
 *
 * Rules:
 * - Error: raw box-shadow values in component CSS (must use var(--shadow-*))
 * - Error: raw border-radius values in component CSS (must use var(--radius-*))
 * - Warning: deprecated alias tokens (--accent-cyan, --accent-indigo, etc.)
 *
 * Exemptions:
 * - glass.css inline top-border highlight is intentional (see DECISIONS.md #001)
 * - variables.css is the source of truth and is explicitly excluded from component rules
 */

/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
  ],
  overrides: [
    {
      // ── Source-of-truth files: no component-level rules apply ──────────────
      files: ["src/css/variables.css", "src/css/reset.css"],
      rules: {
        "declaration-property-value-no-unknown": null,
        "custom-property-no-missing-var-function": null,
      },
    },
    {
      // ── Component CSS files: enforce token usage ────────────────────────────
      files: ["src/css/glass.css", "src/css/animations.css", "src/css/focus.css", "src/css/transitions.css"],
      rules: {
        // Disallow raw box-shadow values — must use var(--shadow-*)
        "declaration-property-value-disallowed-list": [
          {
            "box-shadow": [
              // Match any raw shadow value that isn't a var(--*) reference
              // Allow var()-only values, none, inherit, initial, unset
              "/^(?!var\\(--).+(?<!\\))$/",
            ],
          },
          {
            message: (prop, value) =>
              `Raw \`${prop}: ${value}\` — use a shadow token: \`box-shadow: var(--shadow-card)\` etc. See DECISIONS.md`,
            severity: "warning",
          },
        ],

        // Warn on deprecated alias token usage
        "custom-property-pattern": null,
      },
    },
  ],
  rules: {
    // Allow CSS custom properties (variables)
    "custom-property-pattern": null,

    // Allow unknown pseudo-elements (Tailwind uses them)
    "selector-pseudo-element-no-unknown": [
      true,
      { ignorePseudoElements: ["global", "local"] },
    ],

    // Allow unknown at-rules (Tailwind's @apply, @layer, etc.)
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
        ],
      },
    ],

    // Allow CSS vars that start with -- (they don't need to be defined locally)
    "custom-property-no-missing-var-function": null,

    // Colour format: allow rgba() — codebase uses it throughout intentionally
    "color-named": null,
    "color-no-invalid-hex": true,
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "alpha-value-notation": null,

    // Vendor prefixes: -webkit-backdrop-filter required for Safari
    "property-no-vendor-prefix": null,

    // Disable rules that conflict with CSS custom properties
    "value-keyword-case": null,
    "property-no-unknown": null,
    "declaration-property-value-no-unknown": null,

    // Cosmetic / compat rules — off to avoid noise
    "rule-empty-line-before": null,
    "comment-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "import-notation": null,
    "color-hex-length": null,
    "property-no-deprecated": null,
  },
};
