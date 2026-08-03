# Unified OS Shell — Design

## Architecture

All shell visuals are theme-owned. Components only reference semantic class names.

```
packages/theme/src/css/variables.css   ← tokens (--os-shell-*)
packages/theme/src/css/glass.css       ← .os-shell + variants (appearance)
packages/theme/src/css/animations.css  ← keyframes + .os-shell-enter-* (motion)
        │
        ├── packages/ui/src/components/MacMenuBar.tsx      (os-shell os-shell--taskbar os-shell-enter-1)
        ├── apps/portal/src/app/(auth)/login/page.tsx      (os-shell os-shell--login os-shell-enter-2)
        └── apps/portal/src/components/system/ViewportBoundaries.tsx (os-shell os-shell--dock os-shell-enter-3)
```

## Tokens (variables.css)

> Revision 2 (2026-07-17): gold reflection removed; material overwritten with
> official Liquid Glass — translucent layered surface, blur(24px) saturate(180%)
> backdrop, 1px hairline border, specular inset highlights, concentric radii on
> the 8pt grid (capsule bars, 24px panels).

```css
--os-shell-surface:
  linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0.22) 45%,
    rgba(255, 255, 255, 0.3)
  ),
  rgba(246, 246, 250, 0.5);
--os-shell-border: 1px solid rgba(255, 255, 255, 0.5);
--os-shell-shadow:
  0 16px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08),
  inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.05),
  inset 1px 0 0 rgba(255, 255, 255, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.3);
--os-shell-backdrop: blur(24px) saturate(180%);
--os-shell-radius-lg: 24px;
--os-shell-radius-full: 9999px;
--os-shell-font: var(--font-sans);
--os-shell-enter-duration: 700ms;
--os-shell-enter-ease: cubic-bezier(0.16, 1, 0.3, 1);
--os-shell-enter-delay-1: 0ms;
--os-shell-enter-delay-2: 250ms;
--os-shell-enter-delay-3: 500ms;
```

## Appearance (glass.css)

`.os-shell`: position relative, isolation, overflow hidden, border/background/shadow/backdrop-filter from tokens, font-family token. `.low-perf-fallback .os-shell` swaps to an opaque surface with no blur.

Variants only set radius: `--taskbar` = capsule (9999px), `--login` and `--dock` = `var(--os-shell-radius-lg)` (24px).

Interior chrome (login title bar / banner footer) uses 8pt-grid spacing: `px-4 py-3`.

Login card wrapper width: `max-w-[420px]`; card min-height: `720px` (see `login-form-redesign` spec).

## Motion (animations.css)

- `@keyframes os-shell-reflect` (renamed from `mac-menu-gold-reflect`).
- `@keyframes os-shell-enter-down` (taskbar: fade + translateY(-12px) → 0).
- `@keyframes os-shell-enter-up` (login/dock: fade + translateY(16px) → 0).
- `.os-shell-enter-1/2/3`: `animation: ... var(--os-shell-enter-duration) var(--os-shell-enter-ease) both` with stagger delay tokens. `both` fill keeps pre-animation state hidden and final state persistent.
- Reduced motion: entrance animations `none`, opacity/transform reset; reflection layer static at low opacity.

Note: `.os-shell-enter-*` must be applied to the same element as `.os-shell` only where the element has no competing transform. The dock's split-window translate lives on the same element — the entrance animation uses `both` fill and finishes at `transform: none`, after which the Tailwind translate classes take effect again; the transition-all on the dock handles the runtime shift. Entrance animation ends before user interaction in practice; acceptable trade-off (no extra wrapper).

Actually, to avoid transform conflicts on the dock, the entrance class goes on the outer centering wrapper (`div.w-full.flex.justify-center`) instead of the dock element itself. The taskbar has no competing transform after the earlier full-width change. The login card's entrance replaces the wrapper's `animate-fade-up`.

## Server/client boundaries

CSS-only change; no new client components. `login/page.tsx` remains a Server Component.

## Env vars / new packages

None.

## Files changed

| File                                                          | Change                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| packages/theme/src/css/variables.css                          | add `--os-shell-*` tokens                                                                        |
| packages/theme/src/css/glass.css                              | add `.os-shell` + variants                                                                       |
| packages/theme/src/css/animations.css                         | replace pearl block with keyframes + enter utilities; update reduced-motion block                |
| packages/ui/src/components/MacMenuBar.tsx                     | `mac-menu-bar-pearl` → `os-shell os-shell--taskbar os-shell-enter-1`                             |
| apps/portal/src/app/(auth)/login/page.tsx                     | `pearl-glass-shell` → `os-shell os-shell--login`; wrapper `animate-fade-up` → `os-shell-enter-2` |
| apps/portal/src/components/system/ViewportBoundaries.tsx      | `pearl-glass-shell` → `os-shell os-shell--dock`; wrapper gets `os-shell-enter-3`                 |
| apps/portal/src/components/system/ViewportBoundaries.test.tsx | assert `os-shell` class present (if needed)                                                      |
