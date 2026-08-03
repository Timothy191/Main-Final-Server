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

---

## 011 — Canonical glass schema (`--arch-glass-*`)

**Decision**: All frosted-glass surfaces — chrome (`--os-shell-*`) **and** content
cards (`.glass-card` / `.glass-depth-card`) — derive from a single canonical
token set `--arch-glass-*` in `variables.css`: one backdrop
(`blur(20px) saturate(180%)`), one gradient surface, one border, one shadow
stack. `--os-shell-*` (and the taskbar backdrop) now resolve to
`var(--arch-glass-*)`; `.glass-card`'s backdrop/surface/border/shadow resolve to
the same. Radius/shape stays role-specific (taskbar pill, cards `--radius-card`,
panels square via `.os-shell--panel`).

**Why**: Before this, `.glass-card` ran a parallel glass system (blur 16px sat
120%, `rgba(255,255,255,0.08)`) and several surfaces were ad-hoc
(`bg-arch1/50`, `bg-white/40`, `--vibrancy-surface`). The taskbar, panels, and
cards therefore read as different materials. "One schema, many shapes" makes
the whole UI one material; the _effect_ is shared, only the silhouette varies.

**Migration**: `GlassCard`'s Tailwind overrides (`backdrop-blur-xl`,
`bg-arch-surface-secondary/80`, `backdrop-saturate-[1.3]`, `border-arch-border-subtle`)
were removed so the canonical `.glass-card` CSS drives the effect;
`glassIntensity` presets became opacity-only layers over the canonical backdrop.
`DepartmentLayout` sidebar → `.os-shell--panel`; main pane dropped its ad-hoc
frost (cards on top carry the glass). `ToolBanner` reverted to `.os-shell`.
`KpiCard` → `.glass-card.glass-depth-card`. `.low-perf-fallback .glass-card`
parity added.

**Rule**: No new surface may hand-roll glass. Use `.os-shell*` or `.glass-card`;
extend the canonical family if a new role is needed. Enforced at review and
documented in `docs/design-system/RULES.md` (R2).

---

## 012 — Single ambient background (`RouteBackground`)

**Decision**: The global background is exactly one component,
`apps/portal/src/components/RouteBackground.tsx`: a muted, looping H.264 wave
(`/assets/video/background.mp4`) at 0.65× playback rate with a keep-alive
watchdog, over CSS fallback layers (orbs `animate-wave-canvas-a/b/c`,
`route-bg-fallback`, `-tint`, `-grain`, `-shimmer`). It honors
`prefers-reduced-motion: reduce`. Background theming is done via the
`--canvas-*` and `--wave-*` tokens in `variables.css`, never via a second
page-level `<video>` or CSS backdrop.

**Why**: Concentrates the ambient motion in one asset + one component so every
route shares the same backdrop, playback is resilient to browser interruptions,
and reduced-motion degrades gracefully. Competing page backgrounds would
double-render and fight the ambient layer.

**Rule**: Do not add a second background/animation to a page; do not change the
video source/playback rate outside `RouteBackground.tsx`. See `docs/design-system/RULES.md` (R5).

**Reference**: `apps/portal/src/components/RouteBackground.tsx`; plan
`docs/superpowers/plans/2026-07-17-wave-ambient-permanent-mp4.md`.

---

## 013 — Darker text + less-white glass for legibility

**Decision**: Darken the text tokens one step and reduce the white alphas of the
canonical glass surface ~0.7× so text reads near-black against a subtler frost
instead of blending into the bright white-translucent panel.

**Why**: Muted text on glass was `--text-on-glass-muted: rgba(10,10,20,0.55)`
(only 55% black) on `--arch-glass-surface` (white 0.40→0.20→0.30 + 0.25 base) —
muted labels washed to mid-gray on white and were illegible. Body/heading
(`#3a3a3c` / `#1d1d1f`) were dark gray rather than black. User reported text and
panels "blending in with one another."

**Changes**:

- `--arch-glass-surface` → `0.28 / 0.12 / 0.18 + base 0.15`; `-surface-hover` →
  `0.38 / 0.20 / 0.28 + 0.24`; `--os-shell-taskbar-surface` scaled ~0.7×
  (`0.32 / 0.18 / 0.25 + base rgba(246,246,250,0.21)`). Blur/saturate/border/shadow
  unchanged.
- `--arch8`→`#6e6e73`, `--arch9`→`#3a3a3c`, `--arch10`→`#1d1d1f`, `--arch11`→`#0a0a0c`.
- `--text-on-glass`→`rgba(10,10,20,1)`, `--text-on-glass-muted`→`rgba(10,10,20,0.8)`.
- `--login-text-muted`→`#4a4a52` (login card muted text + placeholder via color-mix).
- `--palette-neutral-400/500/600/900` darkened to match; `--palette-neutral-950`
  →`#050507` only to keep the neutral scale monotonic (it is unused —
  `--palette-brand-primary` and `--palette-semantic-info` are hardcoded `#1c1c1e`,
  so CTA/button/info colors are unchanged).

**Source-of-truth note**: `variables-generated.css` is the _effective_ SSOT for
`--arch8–11` and `--text-on-glass[-muted]` (it loads last in the `theme` layer and
defines them directly). It is a Style Dictionary artifact (`sd.config.mjs`), but
`style-dictionary` is not installed as a devDep, so it is maintained by manual sync
with `tokens.json`. Both were updated to identical values. `src/tokens/generated.ts`
was **not** regenerated: it holds only `var(--token)` _references_ (not resolved
values), so CSS value changes flow through automatically; moreover the committed
`generated.ts` includes `arch0–15` primitives that the current
`generate-tokens.mjs` does not emit, so running it would shrink the file and break
`GlassCard.test.tsx` / `ui-primitives.test.tsx`. That script↔file drift is a
separate cleanup item.

**Rule**: Future text/glass-surface token changes must update all three sources
(`tokens.json`, `variables-generated.css`, `palette.css`/`variables.css`) to keep
them in agreement until Style Dictionary regeneration is restored.

**Reference**: `packages/theme/src/css/variables.css`, `variables-generated.css`,
`palette.css`, `tokens.json`; `docs/design-system/SPEC.md` §2.
