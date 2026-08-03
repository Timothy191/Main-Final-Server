# Compact System Dropdown — Tasks

1. Rewrite the shared dropdown primitive with a context-driven controlled open/close, `asChild` trigger/item cloning, `role="menu"` content that unmounts when closed, and Escape/outside-click handling. Keep all existing exports.
2. Redesign `ServicesDropdown` content as a compact `w-80` rectangular panel: 2-column status grid, 2-column quick-action grid, aligned power footer. Remove nested submenu usage while preserving all actions and overlays.
3. Update `ServicesDropdown.test.tsx` to use the real primitive and assert closed-by-default, trigger toggle, Escape/outside close, status + action visibility, and overlays.
4. Run focused tests, scoped lint/type-check, visual check, then `pnpm quality`; emit alignment score.
