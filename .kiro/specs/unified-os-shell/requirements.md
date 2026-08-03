# Unified OS Shell — Requirements

## Intent

Standardize the three floating "OS chrome" surfaces — top taskbar (`MacMenuBar`), login card, and bottom dock — on one theme-owned visual and motion system: identical glass fill, border, shadow, typography, gold reflection, and a slow staggered entrance.

## Acceptance criteria

1. A single set of shell design tokens exists in `packages/theme/src/css/variables.css` covering: glass surface, border (2px black), layered shadow, gold reflection colors/duration, entrance easing, entrance duration, and stagger delays.
2. A single `.os-shell` appearance class (plus `--taskbar`, `--login`, `--dock` placement variants for radius) lives in `packages/theme/src/css/glass.css`. No visual shell styling remains in `animations.css`.
3. Only keyframes and motion utility classes (`.os-shell-enter-1/2/3`, gold-reflect keyframes) live in `packages/theme/src/css/animations.css`.
4. Entrance sequence is slow and staggered: taskbar first (slides down), login card second (floats up), dock third (floats up). Total sequence uses the emphasis-length duration (>= 600ms per stage).
5. Gold reflection sweep is slower than the current 4.2s (target 9s) and identical across all three surfaces.
6. `prefers-reduced-motion: reduce` disables entrance and reflection animations while keeping the final resting visual state (no invisible content).
7. Temporary class names `pearl-glass-shell` and `mac-menu-bar-pearl` are removed from theme CSS and all consumers.
8. Taskbar keeps: fixed full-width pill placement (`top-2 left-3 right-3`), Arch dropdown open/close via click, Enter, Space, ArrowDown, Escape; traffic lights; right-side tray slot.
9. Login card keeps: `data-testid="login-card"`, min-height 720px, title bar, form, footer; only the shell classes and entrance animation change.
10. Dock keeps: `data-testid="unified-dock"`, split-window translation (`sm:-translate-x-[200px]` when open), app links, tray metrics.
11. Existing tests updated where class assertions change; `pnpm quality` (or scoped lint/type-check/test for touched packages) passes.

## Out of scope

- CommandBar, SplitWindowLayout, SystemTray popovers, and other `liquid-glass-light` consumers (they keep their current styling).
- Dark-mode variants, new dependencies, layout restructuring.
