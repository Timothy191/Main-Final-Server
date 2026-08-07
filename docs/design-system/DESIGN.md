# Arch System — Design System (Design)

This document is the **design** for the Arch Systems Portal visual system: the
intent, the principles, the canonical glass schema, the surface roles, and the
global ambient background. It is the "why and what"; the exact values live in
[SPEC.md](./SPEC.md), and the enforceable rules live in [RULES.md](./RULES.md).

Architectural decisions are recorded as ADRs in
[`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md). This document
summarizes their consequences; consult DECISIONS for rationale.

---

## 1. Intent

The portal is a **light-only, Sonoma-palette, Liquid Glass** operational control surface
for a mining control room (DECISIONS #003). The visual language is white
translucency, liquid glass, and high-contrast ambient shadow over a single
animated ambient backdrop. There is intentionally **no dark mode** — components
reference only semantic, light-only tokens.

The system's job is to make every frosted surface — the top taskbar, the bottom
dock, the login card, department panel shells, hub panels, KPI cards, and every
content card — read as **one material**: the same frost, the same blur, the same
edge light, the same shadow. Shape (radius) varies by role; the _effect_ does
not.

## 2. Principles

1. **One schema, many shapes.** A single canonical glass-effect token set
   (`--arch-glass-*`) backs every glass surface. Chrome and cards are the same
   material at different radii — never different materials.
2. **Tokens, not literals.** Surfaces reference CSS variables and CSS classes,
   never hand-rolled `rgba(...)` / `backdrop-blur-*` in components. The token
   validator (`scripts/validate-tokens.mjs`) is the CI gate.
3. **Tiered tokens.** Primitive → Semantic → Deprecated (DECISIONS #007).
   Components use semantic only.
4. **Style Dictionary is the source.** `tokens.json` → generated CSS/TS/JSON
   (DECISIONS #009). `variables.css` is the hand-maintained semantic layer;
   `variables-generated.css` is generated. Don't edit generated files by hand.
5. **Reduced-motion & low-perf parity.** Every glass surface has an
   opaque/no-blur fallback (`prefers-reduced-motion`, `.low-perf-fallback`) so
   the UI degrades gracefully on constrained hardware.
6. **Light only.** No `-dark` variants, no dark-mode inversions. A dark ambient
   wallpaper behind the login card is _backdrop_, not dark mode (DECISIONS #003,
   #010).

## 3. The canonical glass schema

Defined in `packages/theme/src/css/variables.css` as `--arch-glass-*`:

| Token                        | Role                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `--arch-glass-backdrop`      | `blur(20px) saturate(180%)` — the single frosted effect  |
| `--arch-glass-surface`       | the gradient white-translucent fill (0.40 / 0.20 / 0.30) |
| `--arch-glass-surface-hover` | hover fill (stronger)                                    |
| `--arch-glass-border`        | `1px solid var(--palette-border-glass)`                  |
| `--arch-glass-shadow`        | ambient + contact + 4-edge specular inner-light stack    |

Two consumers derive from it:

- **`--os-shell-*`** (chrome) — `--os-shell-surface/border/shadow/backdrop` are
  now `var(--arch-glass-*)`. The taskbar keeps a dedicated `--os-shell-taskbar-*`
  fill (pill, slightly stronger) but its backdrop is the canonical one.
- **`.glass-card`** (content cards) — `backdrop-filter: var(--arch-glass-backdrop)`,
  surface/border/shadow from the canonical family, `border-radius: var(--radius-card)`.

Before this unification, `.glass-card` ran a parallel system (blur 16px sat 120%,
`rgba(255,255,255,0.08)`, `--radius-card`) and several surfaces were ad-hoc
(`bg-arch1/50`, `bg-white/40`, `--vibrancy-surface`). Those are migrated; see
SPEC.md §"Migration history".

## 4. Surface roles

| Role                                | Class                                               | Radius                          | Where                                                     |
| ----------------------------------- | --------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| Taskbar (top)                       | `.os-shell.os-shell--taskbar`                       | pill (`--os-shell-radius-full`) | `MacMenuBar`                                              |
| Dock (bottom)                       | `.os-shell.os-shell--dock`                          | 24px (`--os-shell-radius-lg`)   | `ViewportBoundaries` unified dock                         |
| Login card                          | `.os-shell.os-shell--login`                         | 24px                            | `(auth)/login`                                            |
| Floating hub panels                 | `.os-shell` + `rounded-[var(--os-shell-radius-lg)]` | 24px                            | hub hero / alert / telemetry, `AlertTicker`, `ToolBanner` |
| Full-height panel shell             | `.os-shell.os-shell--panel`                         | 0 (square)                      | `DepartmentLayout` sidebar                                |
| Content cards                       | `GlassCard` / `.glass-card.glass-depth-card`        | `--radius-card` (20px)          | dashboards, KPIs, sections                                |
| Transient (menus, popovers, scrims) | own light treatment                                 | role-specific                   | out of scope (RULES R4)                                   |

**Why radius varies:** chrome "chips" float (pill/24px); panels are continuous
walls (square); cards are 20px tiles. The _effect_ is identical across all of
them; only the silhouette changes.

## 5. Global ambient background

A single client component, `apps/portal/src/components/RouteBackground.tsx`,
renders the permanent backdrop on every route:

- **One muted, looping H.264 wave** (`/assets/video/background.mp4`) at **1.0×**
  playback rate, `autoPlay/loop/playsInline`, with a **keep-alive watchdog**
  (re-asserts play on pause/visibility/decoder stalls).
- **CSS fallback layers** behind/over the video: animated orbs
  (`animate-wave-canvas-a/b/c`), a static `route-bg-fallback`, `route-bg-tint`,
  `route-bg-grain`, `route-bg-shimmer`.
- **Reduced motion**: `prefers-reduced-motion: reduce` stops the video; the
  static fallback + orbs remain visible.
- **Poster**: `/auth-bg-poster.jpg` until the first decoded frame.

Tokens that theme the background live in `variables.css`:
`--canvas-bg-*`, `--canvas-gradient`, `--canvas-wave-tint-a/b/c`, and the
`--wave-*` wave-intensity/speed/amplitude/opacity controls. Keyframes are in
`animations.css` (`animate-wave-canvas-*`, plus the `.os-shell-enter-*` chrome
entrance animations).

See the implementation plan tracked in the theme decisions log.

**Constraint (RULES R5):** do not add a second page-level background or overlap
the ambient layer. To adjust a page's ambient feel, change the `--canvas-*` /
`--wave-*` tokens or orb classes — not the video.

## 6. GlassCard (the card primitive)

`@repo/ui/GlassCard` is the single component for content cards. It consolidates
the legacy `SpotlightCard` and `GlowBorderCard` into one API with variants:
`default | window | spotlight | glowborder | liquid`. The glass _effect_ comes
from the canonical `.glass-card` CSS; variants only add shape/animation/decoration
(traffic lights, mouse-tracked spotlight, conic rotating border, liquid
displacement). `glassIntensity` presets are **opacity-only** layers over the
canonical backdrop — they never override the shared blur. See `packages/theme/README.md`
for the full props API.

## 7. Login reference surface

The canonical sign-in UI (`apps/portal/src/app/(auth)/login/page.tsx`) is the
reference for light frosted glass on a dark ambient wallpaper (DECISIONS #010).
Its card shell is `--os-shell-*` ← `--palette-glass-*`; its control paints
(fields, CTA, OAuth, notice, brand neon, focus gold) live under dedicated
`--login-*` tokens in `variables.css` and `.login-*` classes in `glass.css`.
Do not hard-code those paints in components — use the tokens.

## 8. Accessibility

- `prefers-reduced-motion: reduce` disables entrance animations and the ambient
  video; static fallbacks remain.
- `.low-perf-fallback` swaps glass for opaque surfaces with no blur (chrome and
  cards both) — use for low-power hardware / battery saver.
- Opacity tokens (`--opacity-focus-dim`, `--opacity-disabled`, `--opacity-hover`)
  enforce WCAG contrast for disabled/dim states (DECISIONS / HUD section).
- Focus rings use `--accent-blue` / `--login-focus-gold-*`; never remove a focus
  style without a replacement.

## 9. Change management

Changing the system is governed by [RULES.md](./RULES.md): use canonical tokens,
no ad-hoc glass, update SPEC.md + an ADR for structural changes, and verify with
the forced quality gate. The token validator (`lint:tokens`) is the CI
enforcement for token integrity; the rest is review-enforced.

## 10. Graph Workspace Customization

To align the local Markdown knowledge graph visualization (e.g., Obsidian graph view) with the Arch System design principles, a custom stylesheet is provided at [`docs/design-system/graph-minimal-glass.css`](./graph-minimal-glass.css).

This styling applies:

- **Minimalist Light Mode**: Smooth background colors (`#f8fafc` and `#f1f5f9`) transitioning the workspace from standard dark backgrounds.
- **Glassmorphic Floating Panels**: Translucent blurs (`backdrop-filter: blur(20px)`) and subtle borders on graph controls, settings panels, and navigation overlays.
- **Color-Coded Domain Clusters**: Maps graph nodes directly to their design system cluster colors (e.g. Cyan/Teal for Frontend, Purple for Backend BFF, Amber for Caching, Emerald for Data, Slate for Tooling/Agents).
