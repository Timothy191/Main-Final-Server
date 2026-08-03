# @repo/theme — Design Decisions

Architectural decisions for the Arch Systems design token system.
Update this file when making structural changes to the theme package.

---

## 001 — Glass top-border as inline style

**Decision**: The macOS glass top-edge highlight (`borderTop: "1px solid rgba(255,255,255,0.9)"`)
is implemented as a React inline style, not a Tailwind class or CSS file rule.

**Why**: Tailwind cannot express `border-top-color` with an independent opacity modifier — the
`border-t-[rgba(...)]` syntax requires a single value. The CSS token `--glass-border-top` exists
but Tailwind's JIT cannot compose it into a `border-top-color` utility at build time.

**Status**: Accepted pattern. All elevated components (GlassCard, login panels, modals) use this
inline style intentionally. Phase 4 work will absorb this into `.glass-macos` and `.glass` CSS
classes so components no longer need the raw inline style.

**Exemption**: ESLint `react/forbid-component-props` and the Stylelint inline-style rule both
whitelist this specific property.

---

## 002 — `--accent-cyan/indigo/violet` as deprecated aliases

**Decision**: `--accent-cyan`, `--accent-indigo`, and `--accent-violet` all map to `#007aff`
(macOS system blue / `--accent-blue`). They are not distinct colours.

**Why they exist**: Early development used `--accent-cyan` (from a previous dark-mode teal
palette, `rgba(0, 212, 170, 0.x)`). When the macOS light theme replaced it, the tokens were
remapped to `--arch15` (#007aff) but usage was too widespread to remove atomically.

**Migration strategy**: Alias-then-migrate. Stylelint emits a `warning` on any new usage.
Components are migrated as they are touched. No hard codemod (155 references in 47 files).

**Tracking**: `packages/theme/scripts/validate-tokens.mjs` warns on deprecated alias usage in
`preset.ts`. The migration is complete when the warning count reaches zero.

---

## 003 — Light-only `color-scheme: light` as default

**Decision**: `variables.css` defines only a `:root` (light) token set. All scaffolding or plans for dark mode have been explicitly removed.

**Why**: The portal is a mining control-room operational tool. The requirement is strictly light-only (macOS Ventura/Sonoma). Maintaining "dark mode ready" tokens creates unnecessary complexity, unused CSS, and architectural debt. The entire visual language is optimized for white translucency, liquid glass, and high-contrast ambient shadows.

**Implication**: Components reference only semantic tokens. No dark-mode inversions or `-dark` variants are supported.

**Clarification**: A dark ambient wallpaper behind the login card is **not** portal dark mode. Login chrome stays light frosted glass; only the backdrop scene may be dark (see #010).

---

## 004 — Department accent colours as runtime Tailwind classes

**Decision**: Department accent colours (blue, emerald, blue, violet, red, blue, cyan, indigo)
are applied via dynamic Tailwind class strings (e.g. `text-blue-500`) rather than CSS variables.

**Why**: There are 8 departments. Encoding each as a CSS variable set would require 8 × N token
definitions and a data-attribute switch per page. The department colour is only used for icon
tinting, hover borders, and ambient background glows — not for text or semantic purpose.

**Implication**: The dynamic class strings (`text-${dept.color}-500`) must be safelisted in
`tailwind.config.ts` to prevent purging. Turborepo's build task handles this correctly via the
portal's `safelist` configuration.

---

## 005 — `--bg-void` removed

**Decision**: `--bg-void` was an exact alias of `--bg-primary` (both = `var(--arch0)`, `#f5f5f7`).
It has been removed from `variables.css` and `colors.ts`.

**Why**: Having two tokens for the same value creates ambiguity about which to use. `--bg-primary`
is the canonical semantic name. Zero component files referenced `--bg-void` directly.

**Migration**: The Tailwind `bg-void` color utility was removed from `preset.ts`. If any component
was using `bg-[var(--bg-void)]` or `bg-void`, replace with `bg-[var(--bg-primary)]` or
`bg-primary`.

---

## 006 — `shadows.ts` normalised to light-mode values

**Decision**: The JS shadow token values in `shadows.ts` were normalised to match the CSS
`variables.css` light-mode shadow definitions exactly.

**Why**: The previous `shadows.ts` had dark-mode-biased opacity values (`rgba(0,0,0,0.35)`,
`rgba(0,0,0,0.28)`) that would produce overly heavy shadows when used in Framer Motion or runtime
style injection on the light theme.

**Rule**: `variables.css` is the single source of truth. `shadows.ts` is auto-generated from
it via `scripts/generate-tokens.mjs`. The JS values should never be edited manually.

---

## 007 — Token tier system

Three tiers enforced by `scripts/validate-tokens.mjs` and documented inline in `variables.css`:

| Tier           | Tokens                                                                                                       | Rule                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Primitive**  | `--arch0`–`--arch15`                                                                                         | Raw values only. Never referenced in components or `preset.ts` semantic sections.   |
| **Semantic**   | `--bg-primary`, `--text-body`, `--shadow-card`, etc.                                                         | All component and utility references. Light-only set in `:root` (no dark variants). |
| **Deprecated** | `--accent-cyan`, `--accent-indigo`, `--accent-violet`, `--accent-alert`, `--accent-blue`, `--accent-emerald` | Map to canonical Tier 2. Stylelint warns. Migrate on touch.                         |

---

## 008 — `tokens` object auto-generated from CSS

**Decision**: `src/tokens/generated.ts` is machine-generated by `scripts/generate-tokens.mjs`
and must not be edited manually.

**Why**: Keeps JS token references (`tokens.color.bg.primary`) always in sync with CSS vars.
Eliminates drift between the CSS source of truth and TypeScript consumers.

**Regenerate**: `pnpm --filter @repo/theme codegen` or `turbo run codegen`.

---

## 009 — Style Dictionary as the single source of truth

**Decision**: `tokens.json` is now the single source of truth for all design tokens.
Style Dictionary generates CSS, TypeScript, and JSON outputs automatically.

**Why**: The previous manual triad (CSS + TS + Tailwind) required editing three files for every
token change. This created drift and maintenance burden. Style Dictionary (industry standard from
Amazon, Salesforce, Adobe) provides a W3C DTCG-compliant token format with automatic multi-platform
output generation.

**Migration**:

- `variables.css` → Now imports `variables-generated.css` (Style Dictionary output)
- `colors.ts` → References updated to use generated values where appropriate
- `tokens.json` → New W3C DTCG format token source file

**Build command**: `pnpm --filter @repo/theme build` or `pnpm codegen`

**Watch mode**: `pnpm tokens:watch` (auto-rebuilds on tokens.json changes)

**Token format**: W3C Design Tokens Community Group (DTCG) specification with references:

```json
{
  "bg": {
    "primary": { "value": "{arch.0}", "type": "color" }
  }
}
```

---

## 010 — Login control tokens (`--login-*`)

**Decision**: Login control paints (fields, CTA, OAuth chips, VPN notice, brand neon, focus chrome including gold peak / inset highlight / outer ring) live under `--login-*` in `variables.css`, with CSS classes `.login-field`, `.login-cta`, `.login-oauth`, `.login-notice` in `glass.css`. The card shell remains `--os-shell-*` ← `--palette-glass-*`.

**Why**: Keeps mock-aligned control paints as theme SSOT without inventing dark-mode UI tokens or hard-coding rgba in `LoginForm` / login page.

**Reference**: `apps/portal/src/app/(auth)/login/page.tsx` + `features/auth` `LoginForm`. Spec: `.kiro/specs/login-form-redesign/`.
