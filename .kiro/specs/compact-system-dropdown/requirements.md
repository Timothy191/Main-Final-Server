# Compact System Dropdown — Requirements

## Intent

The system tray panel in the top header currently renders its content permanently (the shared dropdown primitive ignores `open`), and the menu is an overly tall column with nested submenus. Make it a real controlled dropdown and redesign it as a compact rectangular two-column grid with clearer spacing.

## Acceptance Criteria

1. The shared primitive [`packages/ui/src/components/ui/dropdown-menu.tsx`](../../../packages/ui/src/components/ui/dropdown-menu.tsx) honors `open`/`onOpenChange`: content is not in the DOM while closed.
2. Clicking the trigger toggles the menu; `aria-expanded` reflects state.
3. Pressing `Escape` or clicking outside closes the menu.
4. `DropdownMenuItem` invokes `onSelect` on click and closes the menu afterward.
5. The primitive keeps its current exported API surface (`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuPortal`) so no other importer breaks. No new dependency is added.
6. [`ServicesDropdown.tsx`](../../../apps/portal/src/components/nav/ServicesDropdown.tsx) renders a compact rectangular panel (fixed width, restrained `rounded-lg`) with:
   - a 2-column status grid (weather, shift, wind/visibility, safety alerts),
   - a 2-column quick-action grid (Reload, Toggle Fullscreen, Daily Safety Log, Safety Dashboard, Emergency Line),
   - a compact footer for power actions (Lock, Sleep, Log Out, Restart, Shut Down) with aligned icon/label/shortcut.
7. All existing behavior is preserved: weather fetch, safety alert counts, Alt+S toggle, lock/sleep/shutdown overlays, logout form submit, fullscreen toggle, reload, emergency `tel:` link, navigation to `/safety` and `/safety/daily-log`.
8. Interactive elements are semantic buttons/links, keyboard-navigable, with visible focus rings; the panel uses `role="menu"`.
9. The panel is anchored to the trigger (right-aligned), does not overflow the viewport at desktop and narrow widths, and is closed by default on mount.
10. `ServicesDropdown.test.tsx` exercises the real shared primitive (no mock that masks open/close) and verifies closed-by-default, toggle, Escape/outside close, action visibility, and overlays.
11. `pnpm quality` (or scoped lint + type-check + test) passes.
