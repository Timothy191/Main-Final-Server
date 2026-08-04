# Frontend Component Catalog

This document catalogs every significant frontend component in the Arch System
monorepo: what it does, where it lives, how to import it, and when to use it.

## Shared components (`@repo/ui`)

### Canonical UI primitives (`packages/ui/src/components/ui/*`)

These are the preferred building blocks. Import from `@repo/ui/components/ui/*`
(or named re-exports from `@repo/ui` when available).

#### `Button`

- **Path:** `packages/ui/src/components/ui/button.tsx`
- **Export:** `@repo/ui/components/ui/button`, also re-exported as `@repo/ui/Button`
- **Variants:** `primary` (default), `secondary`, `ghost`, `outline`, `destructive`, `link`
- **Sizes:** `sm`, `md` (default), `lg`
- **Props:** `variant`, `size`, `isLoading`, `asChild`, `disabled`, `className`
- **Use when:** any clickable action. Prefer over `SecondaryButton` (legacy).

#### `Input`

- **Path:** `packages/ui/src/components/ui/input.tsx`
- **Export:** `@repo/ui/components/ui/input`, also re-exported as `@repo/ui/Input`
- **Variants:** `default`, `login`
- **Props:** `error`, `variant`, standard `input` props
- **Use when:** single-line text fields. For labeled/error-wrapped fields, see
  `FormFields.tsx` (`FormInput`).

#### `Badge`

- **Path:** `packages/ui/src/components/ui/badge.tsx`
- **Export:** `@repo/ui/components/ui/badge`, also from `@repo/ui`
- **Variants:** `default`, `success`, `warning`, `error`, `info`, `outline`
- **Use when:** status labels, tags, counters.

#### `Card` family

- **Path:** `packages/ui/src/components/ui/card.tsx`
- **Export:** `@repo/ui/components/ui/card` and named re-exports from `@repo/ui`
- **Parts:** `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- **Use when:** grouping content with `liquid-glass` styling.
- **Note:** This is **not** the canonical frosted-glass card for chrome; for that,
  use `GlassCard`.

#### `Dialog` family

- **Path:** `packages/ui/src/components/ui/dialog.tsx`
- **Export:** `@repo/ui/components/ui/dialog` and named re-exports from `@repo/ui`
- **Parts:** `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogTrigger`, `DialogClose`
- **Status:** ⚠️ accessibility shell. Needs Radix-backed replacement.
- **Use when:** simple modal containers today; prefer `animated-dialog.tsx` for
  animated modals, or wait for accessible replacement.

#### `Tabs` family

- **Path:** `packages/ui/src/components/ui/tabs.tsx`
- **Export:** `@repo/ui/components/ui/tabs` and named re-exports from `@repo/ui`
- **Parts:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- **Status:** ❌ shell — no `value` wiring or active-state logic.
- **Use when:** not recommended until rebuilt.

#### `Table` family

- **Path:** `packages/ui/src/components/ui/table.tsx`
- **Export:** `@repo/ui/components/ui/table` and named re-exports from `@repo/ui`
- **Parts:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- **Status:** ❌ shell — plain HTML passthrough.
- **Use when:** simple static tables only. For data-heavy tables, see `DynamicTable`
  (portal-local) or `DataGrid` (RevoGrid).

#### `DropdownMenu`

- **Path:** `packages/ui/src/components/ui/dropdown-menu.tsx`
- **Export:** `@repo/ui/components/ui/dropdown-menu`, also from `@repo/ui`
- **Status:** ⚠️ partial — controlled open/close + click-outside/escape, but no
  keyboard navigation or ARIA menu roles.
- **Use when:** simple dropdown toggles today.

#### `ScrollArea` / `ScrollBar`

- **Path:** `packages/ui/src/components/ui/scroll-area.tsx`
- **Export:** `@repo/ui/components/ui/scroll-area`
- **Status:** ✅ Radix-backed.
- **Use when:** custom scrollable regions.

#### `Separator`

- **Path:** `packages/ui/src/components/ui/separator.tsx`
- **Export:** `@repo/ui/components/ui/separator`
- **Status:** ✅ Radix-backed.
- **Use when:** horizontal/vertical dividers.

#### `Avatar`

- **Path:** `packages/ui/src/components/ui/avatar.tsx`
- **Export:** `@repo/ui/components/ui/avatar` and `@repo/ui/Avatar`
- **Props:** `src`, `alt`, `fallback`, `size` (`sm`, `md`, `lg`, `xl`)
- **Status:** ⚠️ needs cleanup (dark-mode residue, literal slate colors).

#### `Skeleton` / `GlassSkeleton`

- **Path:** `packages/ui/src/components/ui/skeleton.tsx`, `glass-skeleton.tsx`
- **Export:** `@repo/ui/components/ui/skeleton`, `@repo/ui/components/ui/glass-skeleton`
- **Use when:** loading placeholders. `GlassSkeleton` for glass surfaces.

#### `Spinner` / loading/empty/error states

- **Path:** `packages/ui/src/components/ui/states.tsx`
- **Export:** `@repo/ui/components/ui/states`
- **Exports:** `Spinner`, `LoadingState`, `EmptyState`, `FieldError`
- **Use when:** any async loading, empty collection, or validation error surface.

#### `Pagination` / cursor pagination

- **Path:** `packages/ui/src/components/ui/pagination.tsx`, `pagination-cursor.ts`
- **Export:** `@repo/ui/components/ui/pagination`
- **Use when:** page-based or cursor-based lists.

#### `DataGrid`

- **Path:** `packages/ui/src/components/ui/data-grid.tsx`
- **Export:** `@repo/ui/components/ui/data-grid`
- **Use when:** Excel-like virtual data grids. Requires client-side dynamic
  import because RevoGrid uses `window`.

#### `BentoGrid`, `Marquee`, `AnimatedNumber`, `NumberTicker`, `AnimatedDialog`, `HeroVideoDialog`, `RevealLoader`, `ShineBorder`, `AnimatedGridPattern`, `CyberButton`

- **Use when:** marketing, landing, or decorative surfaces. Not for operational
  control-room chrome.

#### `Kbd`

- **Path:** `packages/ui/src/components/ui/kbd.tsx`
- **Export:** `@repo/ui/Kbd`, `@repo/ui/components/ui/kbd`
- **Use when:** keyboard shortcut hints.

#### `ActionConfirmDialog`

- **Path:** `packages/ui/src/components/ui/action-confirm-dialog.tsx`
- **Export:** `@repo/ui/components/ui/action-confirm-dialog`
- **Use when:** confirmation dialogs. Currently a thin wrapper over the shell
  `Dialog`.

### Legacy/large custom components (`packages/ui/src/components/*`)

#### `GlassCard` (canonical glass card)

- **Path:** `packages/ui/src/components/GlassCard.tsx`
- **Export:** `@repo/ui/GlassCard`
- **Props:** extensive — `variant`, `hover`, `accent`, `glassIntensity`,
  `spotlightColor`, `animationDuration`, `gradientColors`, `colorPreset`, `paused`,
  `blur`, `backgroundOpacity`, `title`, `padding`, `onClick`, `ref`
- **Use when:** any frosted-glass content card. This is the card counterpart to
  `.os-shell*` chrome.
- **Rule:** never add ad-hoc `backdrop-blur-*` or `bg-white/` to a `GlassCard`
  wrapper.

#### `FormFields`

- **Path:** `packages/ui/src/components/FormFields.tsx`
- **Export:** not currently re-exported from `@repo/ui` index (add if needed)
- **Exports:** `FormInput`, `FormSelect`, `FormTextarea`, `FormError`
- **Use when:** labeled form controls with built-in error display.

#### `DesignSystemProvider`

- **Path:** `packages/ui/src/components/DesignSystemProvider.tsx`
- **Export:** `@repo/ui/DesignSystemProvider`
- **Use when:** wrapping the app root. Composes `ArchThemeProvider` + error
  boundary.

#### `DepartmentLayout` / `PageHeader`

- **Use when:** department pages and page-level headers.

#### `MacMenuBar` / `MacTitleBar`

- **Use when:** macOS-style chrome. These should derive from `.os-shell` tokens.

#### `Logo` / `KPI` / `EmptyState` / `CookieConsent` / `Toaster` / `ErrorBoundary`

- Use as named.

## Portal-local components (`apps/portal/src/components/*`)

| Component                  | Path                                                | Purpose                           |
| -------------------------- | --------------------------------------------------- | --------------------------------- |
| `RouteBackground`          | `components/RouteBackground.tsx`                    | Single global ambient background. |
| `CommandBar`               | `components/CommandBar.tsx`                         | Custom ⌘K command palette.        |
| `DynamicTable`             | `components/departments/DynamicTable.tsx`           | Local table abstraction.          |
| `DepartmentSectionShell`   | `components/departments/DepartmentSectionShell.tsx` | Section wrapper.                  |
| `DepartmentReports`        | `components/departments/DepartmentReports.tsx`      | Reports list.                     |
| `BottomNav`                | `components/nav/BottomNav.tsx`                      | Mobile/secondary nav.             |
| `ServicesDropdown`         | `components/nav/ServicesDropdown.tsx`               | Services menu.                    |
| `SystemClock`              | `components/clock/SystemClock.tsx`                  | Uses Radix Popover.               |
| `WeatherWidget`            | `components/weather/WeatherWidget.tsx`              | Weather display.                  |
| `ArchLockOverlay`          | `components/system/ArchLockOverlay.tsx`             | Lock screen overlay.              |
| `ArchMacMenuBar`           | `components/system/ArchMacMenuBar.tsx`              | OS chrome.                        |
| `ArchStartMenu`            | `components/system/ArchStartMenu.tsx`               | Start menu.                       |
| `SystemTray`               | `components/system/SystemTray.tsx`                  | Uses Radix Popover.               |
| `ViewportBoundaries`       | `components/system/ViewportBoundaries.tsx`          | Viewport shell.                   |
| `SplitWindowLayout`        | `components/system/SplitWindowLayout.tsx`           | Resizable split layout.           |
| `RouteAnnouncer`           | `components/RouteAnnouncer.tsx`                     | a11y route announcements.         |
| `WebVitalsReporter`        | `components/WebVitalsReporter.tsx`                  | Web vitals telemetry.             |
| `PerformanceListener`      | `components/PerformanceListener.tsx`                | Performance metrics.              |
| `FeedbackWidget`           | `components/FeedbackWidget.tsx`                     | Feedback capture.                 |
| `PWAInstallButton`         | `components/PWAInstallButton.tsx`                   | PWA install prompt.               |
| `ReviewSchema`             | `components/ReviewSchema.tsx`                       | SEO review schema.                |
| `CursorPaginationControls` | `components/CursorPaginationControls.tsx`           | Pagination UI.                    |
| `OfflineBanner`            | `components/OfflineBanner.tsx`                      | Offline indicator.                |
| `LogoutForm`               | `components/LogoutForm.tsx`                         | Logout action form.               |
| `HeaderWidgets`            | `components/HeaderWidgets.tsx`                      | Header widget cluster.            |
| `PrimitivesShowcase`       | `components/PrimitivesShowcase.tsx`                 | Demo page for primitives.         |

## Feature components (`apps/portal/src/features/*`)

| Feature          | Components                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access-control` | `StatusBadge.tsx`                                                                                                                                                                                                   |
| `admin`          | `AdminTabs.tsx`, `AdminTabsClient.tsx`, `DepartmentsTab.tsx`, `UsersTab.tsx`                                                                                                                                        |
| `analytics`      | `ReportTemplate.tsx`                                                                                                                                                                                                |
| `auth`           | `LoginBrandBanner.tsx`, `LoginEveNotice.tsx`, `LoginForm.tsx`, `LoginSecureBadge.tsx`                                                                                                                               |
| `hub`            | `AlertTicker.tsx`, `DepartmentCard.tsx`, `DepartmentReviews.tsx`, `HeroBackground.tsx`, `HeroRotator.tsx`, `ProductionTrend.tsx`, `ProductionTrendWrapper.tsx`, `Sparkline.tsx`, `ToolBanner.tsx`, `TrustLogos.tsx` |
| `monitoring`     | `AlertCard.tsx`, `KpiCard.tsx`, `ProgressRing.tsx`, `StatusIndicator.tsx`                                                                                                                                           |

## Import conventions

Prefer `@repo/ui/components/ui/*` for new code. Named re-exports from `@repo/ui`
exist for common cases but the component-level path is canonical and tree-shakes
better.

```tsx
// Good
import { Button } from '@repo/ui/components/ui/button'
import { GlassCard } from '@repo/ui/GlassCard'

// Acceptable (legacy compatibility)
import { Button, GlassCard } from '@repo/ui'

// Avoid when a named export exists
import { SecondaryButton } from '@repo/ui' // legacy; prefer Button variant
```

## Component decision tree

| Need                    | Use                                                |
| ----------------------- | -------------------------------------------------- |
| Frosted-glass card      | `GlassCard`                                        |
| OS chrome / panel shell | `.os-shell*` classes from `packages/theme`         |
| Button                  | `Button` from `@repo/ui/components/ui/button`      |
| Text input              | `Input` + `FormFields.FormInput` for labels/errors |
| Status tag              | `Badge`                                            |
| Loading                 | `Spinner` / `LoadingState` from `states.tsx`       |
| Empty list              | `EmptyState` from `states.tsx`                     |
| Modal                   | ⚠️ wait for accessible `Dialog` replacement        |
| Dropdown                | ⚠️ wait for accessible `DropdownMenu` replacement  |
| Tabs                    | ⚠️ build locally or wait for rebuilt `Tabs`        |
| Data table              | `DynamicTable` (portal) or `DataGrid` (`@repo/ui`) |
| Virtual grid            | `DataGrid`                                         |
| Scroll area             | `ScrollArea`                                       |
| Separator               | `Separator`                                        |
| Avatar                  | `Avatar` (after cleanup)                           |
| Command palette         | `CommandBar` (portal-local)                        |
