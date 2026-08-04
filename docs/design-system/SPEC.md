# Arch System — Design System (Specification)

The exact tokens, classes, and visual contracts. This is the "what"; the
intent is in [DESIGN.md](./DESIGN.md), the rules in [RULES.md](./RULES.md).

> **Source of truth:** `packages/theme/src/css/variables.css` (hand-maintained
> semantic layer) + `variables-generated.css` (Style Dictionary output).
> `packages/theme/src/css/palette.css` holds the `--palette-*` primitives.
> This spec mirrors those files for reference; **when they change, update this
> spec in the same change** (RULES R8). Do not edit this spec instead of the CSS
> — the CSS is authoritative.

---

## 1. Token tiers

Per ADR #007, enforced by `packages/theme/scripts/validate-tokens.mjs`:

| Tier           | Tokens                                                                                                                                                   | Rule                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Primitive**  | `--arch0`…`--arch15`, `--palette-*`                                                                                                                      | Raw values only. Never referenced in components or `preset.ts` semantic sections.        |
| **Semantic**   | `--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--arch-glass-*`, `--os-shell-*`, `--glass-*`, `--radius-*`, `--shadow-*`, `--canvas-*`, `--wave-*`, … | The only tier components/utilities may use. Light-only set in `:root`.                   |
| **Deprecated** | `--accent-cyan/indigo/violet/alert/blue/emerald`, `--bg-void`                                                                                            | Map to canonical Tier 2. Stylelint warns. Migrate-on-touch; do not introduce new usages. |

### 1.1 Primitives (`variables.css:14–42`) → palette

`--arch0/1` = `--palette-surface-elevated`; `--arch2` = `--palette-surface-sunken`; `--arch3` = `--palette-surface-pressed`; `--arch4–7` = borders (subtle/default/emphasis/strong); `--arch8–11` = text (muted→primary); `--arch12` = danger; `--arch13` = brand-primary (charcoal); `--arch14` = success; `--arch15` = brand-primary. `--palette-*` values live in `palette.css`.

### 1.2 Semantic aliases (`variables.css:44–109`)

| Token               | Maps to   | Token                            | Maps to    |
| ------------------- | --------- | -------------------------------- | ---------- |
| `--bg-primary`      | `--arch0` | `--text-muted`                   | `--arch8`  |
| `--bg-secondary`    | `--arch1` | `--text-secondary`               | `--arch9`  |
| `--bg-tertiary`     | `--arch2` | `--text-body` / `--text-primary` | `--arch10` |
| `--border-subtle`   | `--arch4` | `--text-heading`                 | `--arch11` |
| `--border-default`  | `--arch5` | `--accent-red`                   | `--arch12` |
| `--border-emphasis` | `--arch6` | `--accent-charcoal`              | `--arch13` |
|                     |           | `--accent-blue` ⚠ deprecated     | `--arch13` |
|                     |           | `--accent-green`                 | `--arch14` |

**Extended action/status** (`variables.css:74–109`): `--accent-electric-blue[-hover/-subtle/-border]`, `--accent-mint[-hover/-subtle/-border]`, `--accent-amber[-hover/-subtle/-border]`; semantic `--color-action-primary[-hover]`, `--color-status-{positive,warning,danger}`; `--success/--warning/--danger/--info` (+ `-foreground`).

### 1.3 Department colors (`variables.css:114–123`)

`--dept-drilling:#2563eb`, `--dept-production:#34c759`, `--dept-access-control:#0284c7`, `--dept-access-card-actions:#3b82f6`, `--dept-engineering:#7c3aed`, `--dept-control-room:#dc2626`, `--dept-safety:#d97706`, `--dept-training:#0891b2`, `--dept-satellite:#4f46e5`, `--dept-admin:#7c3aed`. Applied via safelisted Tailwind classes (ADR #004), not CSS vars.

### 1.4 System chrome (`variables.css:125–128`)

`--mac-red/--mac-yellow/--mac-green` ← `--palette-chrome-{red,yellow,green}`.

### 1.5 Compatibility layers

- **shadcn/ui HSL** (`variables.css:130–152`): `--background 240 5% 96%`, `--foreground 240 6% 10%`, `--card/--popover 0 0% 100%`, `--primary 240 6% 10%`, `--secondary/--muted/--accent 240 5% 91%`, `--muted-foreground 240 3% 44%`, `--destructive 3 78% 46%`, `--border 240 6% 87%`, `--input 240 5% 91%`, `--ring 240 6% 10%`, `--radius 0.75rem`, charts `--chart-1..5`.
- **Tremor** (`variables.css:161–180`): `--tremor-brand-{faint,muted,subtle,DEFAULT,emphasis,inverted}`, `--tremor-background-{muted,subtle,DEFAULT,emphasis}`, `--tremor-border-default`, `--tremor-ring-default`, `--tremor-content-{subtle,DEFAULT,emphasis,strong,inverted}`.

---

## 2. Canonical glass schema (`--arch-glass-*`)

`variables.css` (just above the OS SHELL block). **Single source of truth for the glass effect.**

| Token                        | Value                                                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--arch-glass-backdrop`      | `blur(20px) saturate(180%)`                                                                                                                                                                                                                                                          |
| `--arch-glass-surface`       | `linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 45%, rgba(246,246,250,0.18) 100%), rgba(255,255,255,0.15)`                                                                                                                                                |
| `--arch-glass-surface-hover` | `linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.20) 45%, rgba(246,246,250,0.28) 100%), rgba(255,255,255,0.24)`                                                                                                                                                |
| `--arch-glass-border`        | `1px solid var(--palette-border-glass)`                                                                                                                                                                                                                                              |
| `--arch-glass-shadow`        | `var(--palette-glass-shadow-ambient), var(--palette-glass-shadow-contact), inset 0 1px 0 var(--palette-glass-specular-top), inset 0 -1px 0 var(--palette-glass-contact-bottom), inset 1px 0 0 var(--palette-glass-specular-side), inset -1px 0 0 var(--palette-glass-specular-side)` |

---

## 3. OS Shell (chrome) — derives from canonical

`variables.css` OS SHELL block; classes in `glass.css:1562–1607`.

### 3.1 Tokens

| Token                                                 | Value                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--os-shell-surface`                                  | `var(--arch-glass-surface)`                                                                                                                                                                                                                                            |
| `--os-shell-border`                                   | `var(--arch-glass-border)`                                                                                                                                                                                                                                             |
| `--os-shell-shadow`                                   | `var(--arch-glass-shadow)`                                                                                                                                                                                                                                             |
| `--os-shell-backdrop`                                 | `var(--arch-glass-backdrop)`                                                                                                                                                                                                                                           |
| `--os-shell-radius-lg`                                | `24px`                                                                                                                                                                                                                                                                 |
| `--os-shell-radius-full`                              | `9999px` (pill)                                                                                                                                                                                                                                                        |
| `--os-shell-font`                                     | `var(--font-sans)`                                                                                                                                                                                                                                                     |
| `--os-shell-taskbar-surface`                          | `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.25) 45%, rgba(246,246,250,0.35) 100%), rgba(246,246,250,0.30)`                                                                                                                                  |
| `--os-shell-taskbar-backdrop`                         | `var(--arch-glass-backdrop)`                                                                                                                                                                                                                                           |
| `--os-shell-taskbar-shadow`                           | `0 4px 14px rgba(4,12,24,0.14), 0 1px 3px rgba(4,12,24,0.1), inset 0 1px 0 var(--palette-glass-specular-top), inset 0 -1px 0 var(--palette-glass-contact-bottom), inset 1px 0 0 var(--palette-glass-specular-side), inset -1px 0 0 var(--palette-glass-specular-side)` |
| `--os-shell-enter-duration` / `--os-shell-enter-ease` | `700ms` / `cubic-bezier(0.16, 1, 0.3, 1)`                                                                                                                                                                                                                              |
| `--os-shell-enter-delay-1/2/3`                        | `0ms` / `250ms` / `500ms`                                                                                                                                                                                                                                              |

### 3.2 Classes

| Class                                 | Radius                          | Purpose                                                                                                      |
| ------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.os-shell`                           | inherits                        | Base chrome: `position:relative; isolation:isolate; overflow:hidden;` + surface/border/shadow/backdrop/font. |
| `.os-shell--taskbar`                  | pill (`--os-shell-radius-full`) | Top taskbar — taskbar surface/shadow.                                                                        |
| `.os-shell--login`, `.os-shell--dock` | `24px`                          | Login card, bottom dock.                                                                                     |
| `.os-shell--panel`                    | `0` (square)                    | Full-height operational panel shell (department sidebar).                                                    |
| `.low-perf-fallback .os-shell`        | —                               | Opaque `rgba(246,246,250,0.92)`, no blur.                                                                    |
| `.glass-macos`                        | `blur(20px) saturate(180%)`     | `--glass-surface`                                                                                            | inherits | System translucency |

Entrance animations: `.os-shell-enter-1` (down, 0ms), `.os-shell-enter-2` (up, 250ms), `.os-shell-enter-3` (up, 500ms) — `animations.css:203–216`.

---

## 4. Content-card glass (`.glass-card`) — derives from canonical

`glass.css:70–131`.

### 4.1 `.glass-card`

| Property                        | Value                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `--glass-surface` (local)       | `var(--arch-glass-surface)`                                                       |
| `--glass-surface-hover` (local) | `var(--arch-glass-surface-hover)`                                                 |
| `backdrop-filter`               | `var(--arch-glass-backdrop)` = `blur(20px) saturate(180%)`                        |
| `border`                        | `1px solid transparent` (paints a white-top gradient via `border-box`)            |
| `box-shadow`                    | `var(--arch-glass-shadow)`                                                        |
| `border-radius`                 | `var(--radius-card)` = `20px`                                                     |
| `:hover`                        | surface → `--arch-glass-surface-hover`, `--shadow-card-hover`, `translateY(-2px)` |

### 4.2 `.glass-depth-card`

Adds volumetric depth only (no own backdrop): `box-shadow: var(--shadow-card), inset 0 0.5px 0 rgba(255,255,255,0.9), inset 0 -0.5px 0 rgba(0,0,0,0.03), inset 0 2px 8px rgba(0,0,0,0.02)`. Pair with `.glass-card`.

### 4.3 Low-perf parity

`.low-perf-fallback .glass-card` → opaque `rgba(246,246,250,0.92)`, no blur (mirrors `.os-shell` fallback).

### 4.4 `GlassCard` component (`@repo/ui/GlassCard`)

Variants: `default | window | spotlight | glowborder | liquid`. The glass effect comes from `.glass-card`/`.glass-depth-card`; variants only add shape/animation/decoration. `glassIntensity` (`subtle/moderate/intense` from `@repo/theme` `glassVariants`) is an **opacity-only** layer (`backgroundColor: rgba(255,255,255,${opacity})`) over the canonical backdrop — it never overrides blur. Full props API in `packages/theme/README.md`.

---

## 5. Other glass classes (transient / specialty surfaces)

These are **out of scope for the panel/card unification** (RULES R4) but share the glass token family.

| Class                       | Backdrop                    | Surface                                         | Radius                          | Used for              |
| --------------------------- | --------------------------- | ----------------------------------------------- | ------------------------------- | --------------------- |
| `.glass`                    | `blur(10px) saturate(130%)` | `--glass-surface` gradient                      | —                               | Generic glass         |
| `.glass-input`              | `blur(12px) saturate(150%)` | `--glass-surface`                               | `--radius-button` (9999px)      | Form inputs           |
| `.glass-button`             | `blur(12px) saturate(150%)` | `--glass-surface`                               | `--radius-button`               | Glass buttons         |
| `.glass-premium`            | `blur(16px) saturate(160%)` | `--glass-premium-bg` (135° 0.45→0.15)           | `--glass-premium-radius` (20px) | Premium surfaces      |
| `.glass-video`              | `blur(16px) saturate(160%)` | `--glass-video-surface` `rgba(255,255,255,0.7)` | `--glass-video-radius` (20px)   | Glass over dark media |
| `.glass-dark`               | `blur(20px) saturate(160%)` | `--dark-glass-surface` `rgba(15,23,42,0.75)`    | `--radius-card`                 | Opaque dark panel     |
| `.glass-macos`              | `blur(20px) saturate(180%)` | `--glass-surface`                               | inherits                        | macOS translucency    |
| `.liquid-glass`             | `blur(20px) saturate(180%)` | `--glass-surface`                               | `--radius-card`                 | Core liquid glass     |
| `.liquid-glass-elevated`    | `blur(24px) saturate(200%)` | `--glass-surface-hover`                         | `--radius-card`                 | Elevated liquid       |
| `.uiverse-card` (cards.css) | `blur(20px) saturate(180%)` | `--os-shell-surface`                            | `--os-shell-radius-lg` (24px)   | Card variant          |

### 5.1 Glass tokens (`variables.css:184–233`)

`--glass-surface/-hover/-strong` ← palette; `--glass-border` = `--palette-border-glass-soft`; `--glass-border-top: rgba(255,255,255,0.25)`; `--glass-border-gradient: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.3))`; `--text-on-glass[-muted]` = `rgba(10,10,20,1)` / `rgba(10,10,20,0.8)` (darkened for legibility, ADR #013).

> **Text tokens (ADR #013):** `--arch8`–`--arch11` were darkened one step so text reads near-black on frosted glass: `--arch8 #6e6e73` (muted), `--arch9 #3a3a3c` (tertiary/caption), `--arch10 #1d1d1f` (body), `--arch11 #0a0a0c` (heading). The `--text-* → --arch*` mappings above are unchanged; only the resolved hex shifted.

**Glass-on-Video:** `--glass-video-surface/-hover/-strong` (0.7/0.82/0.9), `--glass-video-backdrop: blur(16px) saturate(160%)`, `--glass-video-border`, `--glass-video-sheen`, `--glass-video-shadow`, `--glass-video-radius: 20px`.

**Dark glass:** `--dark-glass-surface/-hover` (0.75/0.85), `--dark-glass-border`, `--dark-glass-sheen`.

**Premium:** `--glass-premium-bg` (135° 0.45→0.15), `--glass-premium-backdrop: blur(16px) saturate(160%)`, `--glass-premium-border`, `--glass-premium-radius: 20px`, `--glass-premium-shadow`.

**Vibrancy:** `--vibrancy-surface` = `--palette-surface-vibrancy`; `--vibrancy-border` = `--palette-border-subtle`.

---

## 6. Palette glass primitives (`palette.css:88–100`)

Back the canonical glass shadow/specular/border tokens.

| Token                            | Value                            |
| -------------------------------- | -------------------------------- |
| `--palette-glass-fill-top`       | `rgba(255,255,255,0.6)`          |
| `--palette-glass-fill-mid`       | `rgba(255,255,255,0.4)`          |
| `--palette-glass-fill-bottom`    | `rgba(255,255,255,0.49)`         |
| `--palette-glass-tint`           | `rgba(246,246,250,0.55)`         |
| `--palette-glass-surface`        | `rgba(255,255,255,0.63)`         |
| `--palette-glass-surface-hover`  | `rgba(255,255,255,0.71)`         |
| `--palette-glass-surface-strong` | `rgba(255,255,255,0.77)`         |
| `--palette-glass-backdrop`       | `blur(28px) saturate(170%)`      |
| `--palette-glass-specular-top`   | `rgba(255,255,255,0.9)`          |
| `--palette-glass-specular-side`  | `rgba(255,255,255,0.45)`         |
| `--palette-glass-contact-bottom` | `rgba(0,0,0,0.08)`               |
| `--palette-glass-shadow-ambient` | `0 24px 60px rgba(4,12,24,0.35)` |
| `--palette-glass-shadow-contact` | `0 2px 10px rgba(4,12,24,0.22)`  |
| `--palette-border-glass`         | `rgba(255,255,255,0.68)`         |
| `--palette-border-glass-soft`    | `rgba(255,255,255,0.28)`         |
| `--palette-border-glass-catch`   | `rgba(255,255,255,0.2)`          |

---

## 7. Shadow system (`variables.css:255–275`)

| Token                                      | Value                                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--shadow-diffusion-sm`                    | `0 2px 4px -1px rgba(0,0,0,0.04), 0 8px 12px -4px rgba(0,0,0,0.03)`                                                                                            |
| `--shadow-diffusion-md`                    | `0 3px 5px -1px rgba(0,0,0,0.04), 0 14px 18px -5px rgba(0,0,0,0.03)`                                                                                           |
| `--shadow-diffusion-lg`                    | `0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 25px -5px rgba(0,0,0,0.03)`                                                                                           |
| `--shadow-diffusion-xl`                    | `0 4px 8px -2px rgba(0,0,0,0.05), 0 28px 40px -8px rgba(0,0,0,0.04)`                                                                                           |
| `--shadow-card`                            | `0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.03), 0 20px 48px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.7)` |
| `--shadow-card-hover`                      | `0 2px 4px rgba(0,0,0,0.02), 0 6px 16px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.04), 0 28px 64px rgba(0,0,0,0.05), inset 0 0 0 0.5px rgba(255,255,255,0.8)` |
| `--shadow-elevated`                        | `0 2px 4px rgba(0,0,0,0.02), 0 8px 20px rgba(0,0,0,0.03), 0 20px 48px rgba(0,0,0,0.03), 0 32px 72px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.7)` |
| `--shadow-window`                          | `0 2px 4px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.03), 0 24px 56px rgba(0,0,0,0.04), 0 40px 96px rgba(0,0,0,0.05), inset 0 0 0 0.5px rgba(255,255,255,0.8)` |
| `--shadow-glow-primary/blue/electric-blue` | `0 0 20px rgba(28,28,30,0.18), 0 0 60px rgba(28,28,30,0.06)`                                                                                                   |
| `--shadow-glow-mint`                       | `0 0 20px rgba(16,185,129,0.2), 0 0 60px rgba(16,185,129,0.07)`                                                                                                |
| `--shadow-glow-amber`                      | `0 0 20px rgba(245,158,11,0.2), 0 0 60px rgba(245,158,11,0.07)`                                                                                                |

Tailwind shadow utilities (`preset.ts`): `shadow-sm/md/lg` (OKLCH), `window`, `glow-blue`, `diffusion-sm/md/lg/xl`, `diffusion-cyan`, `card`, `card-hover`, `elevated`, `glow-primary`, `glow-electric`, `glow-mint`, `tremor-input`, `tremor-card`, `tremor-dropdown`, `glass-depth`, `glass-depth-hover`, `glass-depth-active`, `liquid-depth-hover`. (`glow-amber` is CSS-only, not in Tailwind.)

> ⚠ **`shadows.ts` partially diverges from CSS.** Its `diffusion-sm/md/lg/xl`
> values mirror `--shadow-diffusion-*` exactly, but `card` / `card-hover` /
> `elevated` / `window` are _simpler_ 2–4-layer stacks that do **not** match the
> richer 5-layer CSS `--shadow-card` family above (CSS is source of truth, ADR
> #006). Glow values also differ slightly (`glow-electric`). Use CSS vars in
> components; reach for `shadows.ts` only for Framer Motion / runtime injection
> where `var()` is unavailable — and prefer `var(--shadow-*)` even there when
> possible.

## 8. Radii (`variables-generated.css` + `variables.css:294–303`)

| Token                        | Value    | Tailwind                              |
| ---------------------------- | -------- | ------------------------------------- |
| `--radius-sm`                | `8px`    | `rounded-sm`                          |
| `--radius-md`                | `12px`   | `rounded-md`                          |
| `--radius-lg`                | `16px`   | `rounded-lg`                          |
| `--radius-xl`                | `24px`   | `rounded-xl`                          |
| `--radius-card`              | `20px`   | `rounded-card`                        |
| `--radius-button`            | `9999px` | (pill inputs/buttons)                 |
| `--radius-full`              | `9999px` | `rounded-full`                        |
| `--liquid-glass-radius-card` | `16px`   | liquid cards                          |
| `--os-shell-radius-lg`       | `24px`   | `rounded-[var(--os-shell-radius-lg)]` |
| `--os-shell-radius-full`     | `9999px` | taskbar pill                          |

> ⚠ **`radii.ts` diverges from CSS on two values only.** It matches CSS for
> `sm/md/lg/xl` (8/12/16/24) but declares `card:'28px'` (CSS: 20px) and
> `button:'12px'` (CSS: 9999px), and omits `full`. CSS is the source of truth;
> Tailwind `rounded-card` resolves to `var(--radius-card)` = 20px. (Note:
> `packages/theme/README.md` §3 lists the older 4/6/8/12 scale — that section is
> stale and predates the Style Dictionary migration; trust the table above.)

## 9. Typography

### 9.1 Font families (`variables.css:487–492`, loaded `app/layout.tsx:45–75`)

| Var              | Stack                                                                                  | Loaded via                               |
| ---------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| `--font-sans`    | `'SF Pro', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif` | `next/font` Inter (400/500/600)          |
| `--font-mono`    | `'Roboto Mono', ui-monospace, SFMono-Regular, Menaco, Monaco, Consolas, monospace`     | `next/font` Roboto_Mono (400/500)        |
| `--font-outfit`  | `'Outfit', ui-sans-serif, system-ui, sans-serif`                                       | `next/font` Outfit (400/500/600)         |
| `--font-display` | `'Anurati', 'Orbitron', ui-sans-serif, system-ui, sans-serif`                          | local `public/fonts/Anurati-Regular.otf` |
| `--font-inter`   | = `--font-sans`                                                                        | —                                        |

Tailwind: `font-sans` / `font-display` / `font-mono` (`preset.ts:33–51`).

> ⚠ `typography.ts` references `--font-space-grotesk` / `--font-geist-mono` — **stale/undefined**; the portal loads Inter/Roboto_Mono/Outfit/Anurati. Do not rely on `typography.ts` font stacks.

### 9.2 Sizes & weights

No dedicated CSS font-size scale — sizes use Tailwind's default scale plus Tremor overrides: `tremor-label 0.75rem/1rem`, `tremor-default 0.875rem/1.25rem`, `tremor-title 1.125rem/1.75rem`, `tremor-metric 1.875rem/2.25rem`. `.glass-card` headings forced to weight `700`, `letter-spacing -0.01em`; `.system-label` 10px uppercase `0.08em` weight 600; display headings (`.hub-hero-title`) use Anurati with a 6-step extrusion shadow.

## 10. Z-index matrix

Two parallel scales (worth consolidating — see caveats):

### 10.1 Content z-matrix (`variables.css:238–242`) — used by `RouteBackground` + portal layout

| Token              | Value | Used by                                      |
| ------------------ | ----- | -------------------------------------------- |
| `--z-background`   | `10`  | `.route-bg-video-container`, `.route-bg-orb` |
| `--z-telemetry`    | `20`  | reserved                                     |
| `--z-primary-card` | `30`  | `<main id="main-content">`                   |
| `--z-navigation`   | `40`  | `<header>` (taskbar)                         |
| `--z-overlay`      | `50`  | reserved                                     |

### 10.2 Design-system z-matrix (`variables.css:342–346`) — overlays

`--z-base:0`, `--z-sticky:10`, `--z-dropdown:50`, `--z-modal:100`, `--z-toast:200`.

### 10.3 Route-background computed layers (`glass.css`)

`.route-bg-fallback` = `calc(var(--z-background) - 1)` = **9**; `.route-bg-video-container`/`.route-bg-orb` = **10**; `.route-bg-tint`/`.route-bg-shimmer` = **11**; `.route-bg-grain` = **12**.

> ⚠ The two scales overlap (`--z-background:10` == `--z-sticky:10`).

## 11. Opacity, blur, focus, transitions

- **Opacity** (`variables.css:325–328`): `--opacity-focus-dim:0.4`, `--opacity-disabled:0.38`, `--opacity-hover:0.08`. Tailwind: `opacity-focus-dim/disabled/hover`.
- **Blur** (`variables.css:333–335`): `--blur-focus-dim:4px`. Tailwind `blur-focus-dim`, `backdropBlur-xl:24px`, `backdropBlur-focus-dim`.
- **Refraction** (`variables.css:280–282`): `--refraction-inner-border: inset 0 1px 0 0 rgba(255,255,255,0.9)`; `--refraction-inner-shadow: inset 0 2px 8px rgba(0,0,0,0.02)`; `--refraction-edge-light: inset 0 0 0 1px rgba(255,255,255,0.6)`.
- **Focus** (`focus.css`): `:focus-visible` → white 2px ring + `--accent-electric-blue-subtle` 4px ring, `border-color: var(--accent-electric-blue-border)`. Login uses gold focus (`--login-focus-gold-*`).
- **Transitions** (`transitions.css`): `--theme-transition-duration: 0ms` by default; off unless `.theme-transitioning` is applied. Tailwind timing functions: `glass: cubic-bezier(0.2,0,0,1)`, `liquid-inertia: cubic-bezier(0.25,1.15,0.45,1)`, `ease-out-smooth: cubic-bezier(0.16,1,0.3,1)`. (There is no `ease-glass`; use `glass`.)

## 12. Background animation system

### 12.1 Canvas / wave tokens (`variables.css:244–250`, `287–290`)

| Token                  | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| `--canvas-bg-from`     | `var(--palette-canvas-from)`                                                  |
| `--canvas-bg-to`       | `var(--palette-canvas-to)`                                                    |
| `--canvas-gradient`    | `linear-gradient(135deg, var(--canvas-bg-from) 0%, var(--canvas-bg-to) 100%)` |
| `--canvas-wave-tint-a` | `rgba(0,102,255,0.09)`                                                        |
| `--canvas-wave-tint-b` | `rgba(16,185,129,0.07)`                                                       |
| `--canvas-wave-tint-c` | `rgba(232,236,244,0.72)`                                                      |
| `--wave-intensity`     | `0.2`                                                                         |
| `--wave-speed-mult`    | `0.5`                                                                         |
| `--wave-ampl-scale`    | `0.4`                                                                         |
| `--wave-opacity`       | `0.25`                                                                        |

TS mirror: `tokens.wave = { intensity:'0.2', speedMult:'0.5', amplScale:'0.4', opacity:'0.25' }`.

### 12.2 Component — `apps/portal/src/components/RouteBackground.tsx`

Single `'use client'` component, mounted once in `apps/portal/src/app/layout.tsx:179` (inside `<ArchThemeProvider><ClientProviders><Suspense fallback={null}>`), behind `<header class="relative z-navigation">` and `<main id="main-content" class="relative z-primary-card">`.

- **Video**: `/assets/video/background.mp4` (asset at `apps/portal/public/assets/video/background.mp4`), poster `/auth-bg-poster.jpg`, `autoPlay muted loop playsInline preload="auto"`, `disablePictureInPicture disableRemotePlayback`, `tabIndex={-1} aria-hidden`.
- **Playback rate**: `0.65`. **Keep-alive**: 2s `setInterval` re-asserts `play()` + `playbackRate` on pause/visibility/decoder stalls.
- **Reduced motion**: `(prefers-reduced-motion: reduce)` via `matchMedia` → stops playback; static fallback + orbs remain.
- **Rendered layers** (in order):
  ```
  <div class="route-bg-fallback" />            z=9   reduced-motion dark wash
  <div class="route-bg-orb route-bg-orb-a animate-wave-canvas-a" />  z=10
  <div class="route-bg-orb route-bg-orb-b animate-wave-canvas-b" />
  <div class="route-bg-orb route-bg-orb-c animate-wave-canvas-c" />
  <div class="route-bg-video-container"><video class="route-bg-video" /></div>  z=10
  <div class="route-bg-tint" />                z=11  cool graded scrim
  <div class="route-bg-grain" />              z=12  SVG fractal noise, grain-dance 8s
  <div class="route-bg-shimmer" />            z=11  diagonal highlight
  ```

### 12.3 Background CSS classes (`glass.css:631–951`)

`.route-bg-fallback` (dark wash `linear-gradient(160deg,#05070c 0%,#0c121c 45%,#121820 100%)`), `.route-bg-orb` + `/-a/-b/-c` (radial orbs, blur 60/80/50px, tints `--canvas-wave-tint-a/b/c`), `.route-bg-video-container` (`#05070c`), `.route-bg-video` (`filter: saturate(1.34) contrast(1.18) brightness(1.08)`), `.route-bg-tint` (cool scrim; mobile variant), `.route-bg-grain` (SVG noise `140px` `opacity:0.024` `grain-dance 8s steps(10)`), `.route-bg-shimmer`. Low-perf overrides keep fallback/video blocks, skip the color-grade filter.

### 12.4 Background keyframes (`animations.css:79–130`, `219–230`)

`wave-canvas-drift-a` (22s), `-b` (28s alternate), `-c` (18s alternate-reverse) — translate3d + scale + opacity drift on the orbs. `grain-dance` (10-step jitter). Reduced-motion (`animations.css:264–280`) disables `wave-canvas-*` and `os-shell-enter-*`.

### 12.5 Rule (R5)

Do not add a second page-level background; do not change the video source/playback rate outside `RouteBackground.tsx`. Theme a page's ambient feel via `--canvas-*` / `--wave-*` tokens or orb classes, not the video. (The hub hero's `HeroBackground.tsx` is a _separate local_ feature wash, not the ambient background.)

## 13. Animation utility classes (`animations.css`)

`animate-shimmer` (2s), `animate-spin` (0.8s), `animate-fade-up` (0.4s), `animate-blob-in` (1.2s, reduced-motion disabled), `animate-wave-canvas-a/b/c`, `animate-window-open` (0.4s), `animate-marquee` / `animate-marquee-vertical` (`var(--duration,40s)`), `os-shell-enter-1/2/3`. Tailwind-defined (preset.ts, separate keyframes): `animate-fade-in`, `animate-float-slow/-delayed`, `animate-grid-drift`, `animate-pulse-slow`, `animate-ken-burns`, `animate-gradient-shift`, `animate-pulse-glow`, `animate-float`, `animate-traffic-pulse`, `animate-liquid-swell`, `animate-liquid-sheen`, `animate-mercury-flow`, `animate-status-glow`. (Some are flagged dead in the `animations.css` header but remain in the preset.)

## 14. Tailwind preset surface (`packages/theme/src/tailwind/preset.ts`)

Exposed as utilities (selected): colors `arch0–15`, `arch.surface.*`, `arch.text.*`, `arch.border.*`, `arch.accent.*`, `arch.glass.*`, `palette.*`, `dept.*`, `hud.*`; semantic `bg-primary`, `text-heading`, `border-default`, `accent-charcoal`, etc.; opacity `focus-dim/disabled/hover`; blur `focus-dim`, `backdropBlur-xl:24px`; shadows (see §7); radii `sm/md/lg/xl/card/full`; timing `glass/liquid-inertia/ease-out-smooth`; fontSize `tremor-*`. Container `center, padding 2rem, 2xl 1400px`. Content globs include `packages/ui` and `packages/theme` src.

## 15. Login control tokens (`--login-*`)

The login reference surface (`apps/portal/src/app/(auth)/login/page.tsx`) uses `--os-shell--login` for the card shell and dedicated `--login-*` tokens (ADR #010) for control paints — **do not hard-code these in components**. Groups: `--login-control-radius` (16px), `--login-card-max-width/-min-height/-viewport-taskbar-offset/-page-offset-top/-padding-x/-sm`, `--login-field-bg/-bg-focus/-border/-shadow/-backdrop`, `--login-cta-bg/-bg-hover/-fg/-border/-shadow`, `--login-oauth-bg/-bg-hover/-border/-backdrop`, `--login-notice-bg/-border/-radius`, `--login-wordmark-color/-shadow`, `--login-chrome-band`, `--login-brand-neon-core/-mid`, `--login-focus-gold-*` (incl. `-inset-highlight`, `-glow-peak`), `--login-shell-bg`, `--login-shell-backdrop`, `--login-shell-edge`, `--login-shell-shadow`, `--login-oauth-fg`, `--login-oauth-shadow`. Classes: `.login-field`, `.login-cta`, `.login-oauth`, `.login-notice`, `.login-checkbox`, `.login-card-*`, `.login-chrome-band`, `.login-brand-neon`, `.login-brand-fold`, `.login-wordmark`, `.hub-hero-title`, `.login-eve-status`.

## 16. Migration history (glass unification)

| Surface                   | Before                                                             | After                                                                |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| ToolBanner                | WIP `bg-transparent`                                               | `.os-shell` + `rounded-[var(--os-shell-radius-lg)]`                  |
| DepartmentLayout sidebar  | `bg-[var(--vibrancy-surface)] backdrop-blur-2xl` + inline border   | `.os-shell.os-shell--panel`                                          |
| DepartmentLayout main     | `bg-white/40 backdrop-blur-sm`                                     | transparent canvas (cards on top carry glass)                        |
| KpiCard / KpiCardSkeleton | `bg-arch1/50 border-arch5/20 rounded-xl`                           | `.glass-card.glass-depth-card rounded-[var(--radius-card)]`          |
| `.glass-card`             | `blur(16px) sat(120%)`, `rgba(255,255,255,0.08)`                   | `var(--arch-glass-backdrop/surface/border/shadow)`                   |
| `GlassCard` variants      | Tailwind `backdrop-blur-xl bg-arch-surface-secondary/80` overrides | canonical `.glass-card` drives effect; `glassIntensity` opacity-only |
| `--os-shell-*`            | own surface/border/shadow/backdrop                                 | `var(--arch-glass-*)` (taskbar keeps fill, backdrop canonical)       |
| docs/api header           | `glass-card ... backdrop-blur-xl`                                  | `.glass-card` (redundant override removed)                           |

## 17. Cross-reference caveats (known drift / gotchas)

1. **`shadows.ts` partially diverges from CSS** — `diffusion-*` mirror CSS exactly, but `card`/`card-hover`/`elevated`/`window`/`glow-electric` are simpler stacks that don't match the richer CSS `--shadow-*` family. CSS is the source of truth (ADR #006); use `var(--shadow-*)` in components, `shadows.ts` only for Framer Motion/runtime injection.
2. **`radii.ts` diverges from CSS on `card` (28 vs 20px) and `button` (12 vs 9999px) only** — `sm/md/lg/xl` match (8/12/16/24); `full` is omitted in TS. CSS/Tailwind wins.
   Also `packages/theme/README.md` §3 lists a stale 4/6/8/12 scale predating Style Dictionary — trust SPEC §8, not README §3.
3. **`--chrome-border` is a dangling reference.** `preset.ts:81` maps `'chrome-border': 'var(--chrome-border)'`, but only `--palette-chrome-border` is defined (`palette.css:58` → `var(--palette-border-subtle)`); the unprefixed `--chrome-border` is not defined in `packages/theme` or `packages/ui`. The `chrome-border` Tailwind utility therefore resolves to an empty value — treat as broken/dead until fixed (map it to `var(--palette-chrome-border)`).
4. **`--font-space-grotesk` / `--font-geist-mono`** in `typography.ts` are stale/undefined — portal loads Inter/Roboto_Mono/Outfit/Anurati.
5. **Duplicate keyframes** — `border-glow-sweep`, `grain-dance`, `login-gold-border-sweep`, `login-card-gold-glow` are defined in both `glass.css` and `animations.css` (the latter exports the utility classes; the former uses them inline).
6. **Light-only** — `color-scheme: light` (`variables.css:494`); `colorsDark`/`hslDark` are deprecated no-op aliases (ADR #003).
7. **Theme transitions off by default** — `--theme-transition-duration: 0ms`; enabled only via `.theme-transitioning`.
8. **Two z-index scales overlap** — `--z-background:10` == `--z-sticky:10` (consolidation TODO).
9. **Asset path** — plan doc says `public/background/ps3-wave.1920x1080.mp4`; the integrated path is `/assets/video/background.mp4` (asset at `apps/portal/public/assets/video/background.mp4`).
10. **Two `tokens.json` files — don't confuse them.** `packages/theme/tokens.json` (11 KB, root) is the **real** W3C DTCG token source per ADR #009 (Style Dictionary consumes it). `packages/theme/src/tailwind/tokens.json` (108 bytes) is a **stub** (`{colors:{}, boxShadow:{}, borderRadius:{"undefined":"0.75rem"}, fontSize:{}}`) — not the source of truth. The authoritative CSS/TS still comes from `variables.css` + `preset.ts`; the root `tokens.json` feeds Style Dictionary generation.
