# UI Kit Audit — @repo/ui & apps/portal

> Audit date: 2026-08-04  
> Scope: `packages/ui/src`, `apps/portal/src/components`, `apps/portal/src/features`, `apps/portal/src/app/**/components`, `packages/theme`

## Executive summary

The frontend does **not** use an off-the-shelf UI kit. It uses a bespoke design
system centered on a macOS-style frosted-glass visual language. The shared
component layer is split between:

- `@repo/theme` — tokens, CSS, Tailwind preset.
- `@repo/ui` — hand-rolled React primitives, many of them "shadcn-style" in
  shape but themed with Arch tokens.
- Local components in `apps/portal` — feature-specific and page-level UI.

The system is **mature and enforceable** (token validator, design ratchet, shape
guard, forced quality gates), but several components are incomplete, inconsistent,
or duplicating effort.

## Strengths

1. **Strong token architecture.** Three-tier tokens (primitive → semantic →
   deprecated), a canonical glass schema (`--arch-glass-*`), and shadcn/Tremor
   compatibility variables already in place.
2. **Mechanical enforcement.** `lint:tokens`, `design:ratchet`, `theme:shape`,
   and forced turbo quality gates prevent silent drift.
3. **Clear visual contract.** `DESIGN.md`, `SPEC.md`, and `RULES.md` define the
   single glass material, OS chrome, and card roles.
4. **Copy-paste friendly structure.** `packages/ui/src/components/ui/*` already
   follows shadcn-style naming, so selective adoption is low-friction.

## Weaknesses

1. **Many primitives are shells.** Several "ui" components (`Dialog`, `Tabs`,
   `Table`, `DropdownMenu`) export minimal wrappers that lack accessibility,
   focus management, and keyboard behavior.
2. **Ad-hoc glass styling persists.** 122 banned-pattern matches across the portal
   (`bg-white/5`, `bg-white/10`, `bg-white/70`, `backdrop-blur-xl`,
   `bg-arch-surface-secondary/50`, etc.) violate `docs/design-system/RULES.md`.
3. **No form abstraction.** No `Form`, `Label`, `Textarea`, `Checkbox`, `Switch`,
   `RadioGroup`, or `Select` primitives. Pages build forms with raw HTML and
   inline styles.
4. **Two input components.** `packages/ui/src/components/ui/input.tsx` and
   `packages/ui/src/components/Input.tsx` (which re-exports it) plus
   `packages/ui/src/components/FormFields.tsx` with its own styling. Consumers
   import from different paths.
5. **Inconsistent dark-mode residue.** Some components still carry `dark:`
   Tailwind classes even though the system is explicitly light-only. This is
   dead code.
6. **Duplicate loading/empty states.** `packages/ui/src/components/ui/states.tsx`
   consolidates some, but many pages still inline spinners and empty markup.
7. **`@repo/departments/ui` is a stub.** It only exports `export type {}`.

## Component inventory

### Shared primitives (`packages/ui/src/components/ui/*`)

| Component                   | Lines | Status           | Notes                                                                             |
| --------------------------- | ----- | ---------------- | --------------------------------------------------------------------------------- |
| `action-confirm-dialog.tsx` | 14    | ✅ thin wrapper  | Re-exports `Dialog`.                                                              |
| `animated-dialog.tsx`       | 186   | ✅ custom        | Framer Motion based.                                                              |
| `animated-grid-pattern.tsx` | 163   | ✅ custom        | Decorative background.                                                            |
| `animated-number.tsx`       | 146   | ✅ custom        | Animation utility.                                                                |
| `avatar.tsx`                | 53    | ⚠️ needs cleanup | Still has `dark:` classes; uses `bg-slate-100` instead of tokens.                 |
| `badge.tsx`                 | 33    | ✅ good          | Uses semantic tokens.                                                             |
| `bento-grid.tsx`            | 106   | ✅ custom        | Layout component.                                                                 |
| `button.tsx`                | 85    | ✅ good          | Variants map to Arch tokens.                                                      |
| `card.tsx`                  | 61    | ✅ good          | Uses `liquid-glass` class.                                                        |
| `cyber-button.tsx`          | 92    | ✅ custom        | Branded button variant.                                                           |
| `data-grid.tsx`             | 76    | ✅ good          | Wraps RevoGrid with `GlassCard`.                                                  |
| `dialog.tsx`                | 41    | ❌ shell         | No Radix; no focus trap / portal / accessibility.                                 |
| `dropdown-menu.tsx`         | 212   | ⚠️ partial       | Custom context + escape/click-outside, but no keyboard navigation, no menu roles. |
| `glass-skeleton.tsx`        | 30    | ✅ good          | Uses glass tokens.                                                                |
| `hero-video-dialog.tsx`     | 148   | ✅ custom        | Marketing/video component.                                                        |
| `input.tsx`                 | 45    | ✅ good          | Two variants (`default`, `login`).                                                |
| `kbd.tsx`                   | 18    | ✅ good          | Keyboard key styling.                                                             |
| `marquee.tsx`               | 74    | ✅ custom        | Animation.                                                                        |
| `number-ticker.tsx`         | 74    | ✅ custom        | Animation.                                                                        |
| `pagination.tsx`            | 264   | ✅ good          | Full pagination.                                                                  |
| `reveal-loader.tsx`         | 66    | ✅ custom        | Branded loader.                                                                   |
| `scroll-area.tsx`           | 46    | ✅ good          | Radix ScrollArea wrapper.                                                         |
| `separator.tsx`             | 26    | ✅ good          | Radix Separator wrapper.                                                          |
| `shine-border.tsx`          | 63    | ✅ custom        | Decorative.                                                                       |
| `skeleton.tsx`              | 14    | ✅ good          | shadcn-style skeleton.                                                            |
| `spinner.tsx`               | 31    | ✅ good          | Loading indicator.                                                                |
| `states.tsx`                | 132   | ✅ good          | `Spinner`, `LoadingState`, `EmptyState`, `FieldError`.                            |
| `table.tsx`                 | 70    | ❌ shell         | Plain HTML table elements with passthrough className.                             |
| `tabs.tsx`                  | 34    | ❌ shell         | No active-state logic, no `value` wiring.                                         |
| `action-confirm-dialog.tsx` | 14    | ✅ thin wrapper  | Re-exports `Dialog`.                                                              |
| `animated-dialog.tsx`       | 186   | ✅ custom        | Framer Motion based.                                                              |

### Legacy/large custom components (`packages/ui/src/components/*`)

| Component                            | Role                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `AnimatedButton.tsx`                 | Marketing CTA.                                                           |
| `AnimatedList.tsx`                   | List animation.                                                          |
| `Checkbox.tsx`                       | Custom checkbox (legacy).                                                |
| `CookieConsent.tsx`                  | Cookie banner.                                                           |
| `DepartmentLayout.tsx`               | Department page shell.                                                   |
| `DesignSystemProvider.tsx`           | Theme + error boundary provider.                                         |
| `EmptyState.tsx`                     | Empty state illustration.                                                |
| `ErrorBoundary.tsx`                  | React error boundary.                                                    |
| `FormFields.tsx`                     | `FormInput`, `FormSelect`, `FormTextarea`, `FormError`.                  |
| `GlassCard.tsx`                      | **Canonical glass card** (complex, with spotlight/glow/liquid variants). |
| `Input.tsx`                          | Re-export of `ui/input.tsx`.                                             |
| `KPI.tsx`                            | KPI metric card.                                                         |
| `Logo.tsx`                           | Brand logo.                                                              |
| `MacMenuBar.tsx` / `MacTitleBar.tsx` | macOS chrome.                                                            |
| `Marquee.tsx`                        | Re-export of `ui/marquee.tsx`.                                           |
| `PageHeader.tsx`                     | Page header pattern.                                                     |
| `SecondaryButton.tsx`                | Legacy secondary button.                                                 |
| `ShiftToggle.tsx`                    | Shift state toggle.                                                      |
| `Toaster.tsx`                        | Sonner toast wrapper.                                                    |

### Portal-local components (`apps/portal/src/components/*`)

Key local components include:

- `RouteBackground.tsx` — global ambient background (single source, RULE R5).
- `CommandBar.tsx` — custom command palette (uses keyboard shortcuts, no `cmdk`).
- `DynamicTable.tsx` — local table abstraction.
- `GlassCard.test.tsx` / `ui-primitives.test.tsx` — component tests.
- `nav/BottomNav.tsx`, `nav/ServicesDropdown.tsx` — navigation chrome.
- `system/*` — lock overlay, start menu, system tray, viewport boundaries, split
  window layout.
- `clock/SystemClock.tsx`, `weather/WeatherWidget.tsx` — widget chrome.

### Feature components (`apps/portal/src/features/*`)

- `auth/*` — login form, secure badge, brand banner.
- `hub/*` — department cards, hero rotator, alert ticker, tool banner, production
  trend.
- `access-control/*` — status badge.
- `admin/*` — admin tabs.
- `analytics/*` — report template.
- `monitoring/*` — alert card, KPI card, progress ring, status indicator.

## Gap analysis

### Missing primitives (high value)

These would eliminate repeated inline form and overlay markup:

- `Label`
- `Textarea`
- `Select` / `NativeSelect`
- `Checkbox`
- `Switch`
- `RadioGroup`
- `Slider`
- `Tooltip`
- `Popover` (Radix already a peer dep; only `SystemClock`/`SystemTray` use it)
- `Command` / command palette (replace custom `CommandBar`)
- `Calendar` / `DatePicker`
- `Accordion` / `Collapsible`
- `HoverCard`
- `Menubar` / `NavigationMenu`
- `Drawer` / `Sheet`
- `Resizable`
- `Toggle` / `ToggleGroup`

### Quality issues (should be fixed)

1. **Dialog accessibility.** `packages/ui/src/components/ui/dialog.tsx` needs
   Radix Dialog (or equivalent) for focus trap, `aria-modal`, ESC handling, and
   portal rendering. Current implementation is `display: none` by boolean only.
2. **Tabs state.** `packages/ui/src/components/ui/tabs.tsx` accepts `defaultValue`
   but never uses it.
3. **Table semantics.** `packages/ui/src/components/ui/table.tsx` is just a
   styled passthrough; sorting, selection, and accessibility are missing.
4. **Dropdown keyboard navigation.** Add arrow-key / home/end / enter / space
   support, or replace with Radix Dropdown Menu.
5. **Avatar token cleanup.** Remove `dark:` classes and `bg-slate-100` literal;
   use `--bg-secondary` / `--text-secondary`.
6. **Dark-mode residue.** Remove all `dark:` utilities from `Avatar`,
   `PrimitivesShowcase`, and any other component. The system is light-only.
7. **Duplicate inputs.** Standardize on `@repo/ui/components/ui/input` and delete
   `packages/ui/src/components/Input.tsx` if it only re-exports.

### Pattern duplication

- ~30 pages inline their own loading/empty/error states despite `states.tsx`.
- ~50 pages inline their own card headers / table headers with
  `bg-arch-surface-secondary/50`.
- Multiple custom command palettes / search dialogs exist or are emerging.

## Migration risk: full shadcn/ui vs. selective adoption

| Approach                      | Stability impact                                | Effort | Recommendation   |
| ----------------------------- | ----------------------------------------------- | ------ | ---------------- |
| **Full shadcn/ui migration**  | High short-term instability; breaks glass rules | Large  | **Avoid.**       |
| **Selective shadcn adoption** | Low; keeps theme as source of truth             | Medium | **Recommended.** |
| **Keep bespoke only**         | Stable, but slower to build complex primitives  | Medium | Acceptable.      |

The current system is already enforceable and brand-distinct. A wholesale kit
swap would discard the very rules that make the UI consistent. The pragmatic
path is to treat shadcn as a **pattern library** for missing primitives, not as a
visual system.

## Recommended priorities

1. **P0 — Fix accessibility shells.** Replace `Dialog`, `DropdownMenu`, `Tabs`
   with Radix-backed implementations that still use Arch tokens.
2. **P1 — Add form primitives.** `Label`, `Textarea`, `Select`, `Checkbox`,
   `Switch`, `RadioGroup`.
3. **P1 — Ratchet down ad-hoc glass.** Tighten `design:ratchet` baseline by
   migrating the 122 violations to canonical classes.
4. **P2 — Consolidate command/search.** Adopt `cmdk`-style primitive or build a
   first-class `Command` component.
5. **P2 — Remove dark-mode residue.** Strip all `dark:` classes.
6. **P3 — Document and test.** Add Storybook or at least per-component examples
   in `frontend-docs/` and unit tests for each primitive.
