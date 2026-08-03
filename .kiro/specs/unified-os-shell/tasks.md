# Unified OS Shell — Tasks

## Ordered tasks

- [x] T1. Add `--os-shell-*` tokens to `packages/theme/src/css/variables.css`.
- [x] T2. Add `.os-shell` foundation + `--taskbar` / `--login` / `--dock` variants to `packages/theme/src/css/glass.css`.
- [x] T3. Replace temporary pearl / mac-menu-bar-pearl block in `packages/theme/src/css/animations.css` with `os-shell-reflect`, `os-shell-enter-down`, `os-shell-enter-up` keyframes and `.os-shell-enter-1/2/3` utilities; update reduced-motion overrides.
- [x] T4. Migrate `MacMenuBar.tsx` to `os-shell os-shell--taskbar os-shell-enter-1`.
- [x] T5. Migrate login card to `os-shell os-shell--login`; put `os-shell-enter-2` on its wrapper (replace `animate-fade-up`).
- [x] T6. Migrate dock to `os-shell os-shell--dock`; put `os-shell-enter-3` on the bottom centering wrapper (avoid transform conflict with split-window shift).
- [x] T7. Update ViewportBoundaries test to assert `os-shell` class; confirm login page test still passes.
- [x] T8. Runtime verify `/login` (appearance sync, stagger, reduced-motion, Arch dropdown). Run focused tests + `pnpm quality`. Emit alignment score.

## Done when

All acceptance criteria in `requirements.md` pass and Alignment Score ≥ 80.
