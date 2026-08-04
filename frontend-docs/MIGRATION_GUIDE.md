# shadcn/ui Adoption Guide

This guide explains how to bring shadcn/ui primitives into Arch System **without
breaking the custom design system**.

## Core principle

**Do not migrate to shadcn/ui. Migrate _from_ shadcn/ui.**

shadcn is a copy-paste component library, not a runtime dependency. Treat it as
a source of well-tested, accessible component **patterns**. Copy the component,
then re-style it with Arch tokens and glass rules.

## Why not a wholesale migration?

- shadcn's visual defaults (neutral grays, no glass, generic radius) conflict
  with the macOS frosted-glass brand.
- The design system has mechanical enforcement (`design:ratchet`, `lint:tokens`,
  `theme:shape`) that a kit does not satisfy automatically.
- Many existing components (`GlassCard`, `.os-shell*`, `RouteBackground`) are
  bespoke and would need expensive re-implementation.

## What to adopt from shadcn/ui

Adopt primitives where accessibility and behavior matter more than brand
styling:

| Priority | Primitives                                                                | Rationale                                                        |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| P0       | `Dialog`, `DropdownMenu`, `Tabs`                                          | Current versions are shells without focus/keyboard/ARIA support. |
| P1       | `Form`, `Label`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup` | Forms are currently built with raw HTML + inline styles.         |
| P1       | `Command` / `cmdk`                                                        | Replace custom `CommandBar` with a maintained primitive.         |
| P2       | `Tooltip`, `Popover`, `HoverCard`                                         | Radix already a peer dep; only a few components use it today.    |
| P2       | `Accordion`, `Collapsible`                                                | Common disclosure patterns.                                      |
| P2       | `Calendar`, `DatePicker`                                                  | Date inputs are hand-rolled today.                               |
| P3       | `Menubar`, `NavigationMenu`, `Resizable`, `Drawer`, `Sheet`               | Nice-to-have for advanced layouts.                               |

## What NOT to adopt

- **Card styling.** Keep `GlassCard` and `.glass-card`.
- **Button styling.** Keep the existing `Button`; it already maps to Arch tokens.
- **Color system.** Keep `@repo/theme` tokens.
- **Layout components.** Keep `DepartmentLayout`, `PageHeader`, OS chrome.

## Adoption workflow

### 1. Pick a primitive

Example: `Dialog` from shadcn/ui.

### 2. Copy the shadcn source into `packages/ui/src/components/ui/`

Use the exact shadcn component structure so the API is familiar:

```text
packages/ui/src/components/ui/dialog.tsx
```

### 3. Replace shadcn tokens with Arch tokens

Map shadcn variables to Arch semantic tokens:

| shadcn variable            | Arch replacement                         |
| -------------------------- | ---------------------------------------- |
| `bg-background`            | `bg-primary` or `bg-[var(--bg-primary)]` |
| `bg-card`                  | `bg-[var(--glass-surface)]`              |
| `text-foreground`          | `text-arch-text-primary`                 |
| `text-muted-foreground`    | `text-arch-text-muted`                   |
| `border-border`            | `border-arch-border-default`             |
| `ring-ring`                | `ring-arch-accent-charcoal`              |
| `bg-white` (card surface)  | `bg-[var(--glass-surface)]`              |
| `backdrop-blur` on dialogs | derive from `--arch-glass-backdrop`      |

For glass dialogs specifically:

```tsx
// Add to the overlay/content
className={cn(
  'fixed inset-0 z-50 flex items-center justify-center p-4',
  'bg-black/60 backdrop-blur-sm', // scrim is allowed (transient surface)
)}
```

```tsx
// Dialog content body
className={cn(
  'relative w-full max-w-lg rounded-2xl border border-[var(--arch-glass-border)]',
  'bg-[var(--glass-surface)] backdrop-filter-[var(--arch-glass-backdrop)]',
  'shadow-[var(--shadow-window)]',
)}
```

### 4. Remove dark-mode variants

Delete all `dark:*` classes from the copied component. The theme is light-only.

### 5. Add to `@repo/ui` re-exports

Update `packages/ui/src/index.ts` so consumers can import from `@repo/ui`.

### 6. Write tests

Add a test file in `packages/ui/src/components/ui/__tests__/dialog.test.tsx` (or
parallel to the component) covering:

- open/close behavior
- focus trap
- escape key
- ARIA roles (`dialog`, `aria-modal`, `aria-labelledby`)

### 7. Update the docs

- Update `frontend-docs/COMPONENT_CATALOG.md`.
- If the change is structural, add an ADR to `packages/theme/DECISIONS.md`.
- If token values changed, update `docs/design-system/SPEC.md`.

### 8. Verify

```bash
pnpm --filter @repo/theme lint:tokens
pnpm design:ratchet
pnpm theme:shape
pnpm exec turbo run lint type-check test --force
pnpm format:check
```

## Example: replacing the shell `Dialog`

Current `packages/ui/src/components/ui/dialog.tsx` is 41 lines with no Radix.
After migration it should look approximately like:

```tsx
'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'rounded-2xl border border-[var(--arch-glass-border)]',
        'bg-[var(--glass-surface)] backdrop-filter-[var(--arch-glass-backdrop)]',
        'shadow-[var(--shadow-window)] p-6',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 ...">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

(Header/Footer/Title/Description remain simple layout wrappers.)

## Dependency checklist

Before adding a shadcn primitive, ensure these peer deps are available:

- `@radix-ui/react-*` (dialog, dropdown-menu, tabs, select, checkbox, etc.)
- `class-variance-authority` if the shadcn component uses CVA
- `clsx` and `tailwind-merge` (already installed)
- `lucide-react` for icons (already installed)

If a new Radix primitive is needed, add it to `packages/ui/package.json` and
`apps/portal/package.json` as a dependency.

## Long-term target architecture

```text
@repo/theme          → tokens, CSS, Tailwind preset (source of truth)
@repo/ui             →
  components/ui/*    → shadcn-derived primitives, re-themed with Arch tokens
  components/*       → large/custom/brand components (GlassCard, MacMenuBar, etc.)
apps/portal          →
  components/*       → app-level shared components
  features/*/components → feature-local components
  app/**/components  → page-local components
```

## Anti-patterns to avoid

- **Installing `shadcn` CLI and running `npx shadcn add -y`.** This drops
  un-themed components that violate glass rules.
- **Keeping `dark:` classes from shadcn.** Delete them.
- **Using shadcn's `bg-white` / `bg-card` directly on panels.** Map to
  `var(--glass-surface)` or `.os-shell`.
- **Forgetting to update `packages/ui/src/index.ts`.** New components should be
  discoverable from `@repo/ui`.
- **Skipping tests.** Accessibility primitives must be tested.

## Verification after any adoption

Always run:

```bash
pnpm --filter @repo/theme lint:tokens
pnpm design:ratchet
pnpm theme:shape
pnpm exec turbo run lint type-check test --force
pnpm format:check
```

Do not claim "done" from a non-forced `pnpm quality` run — turbo lint cache can
mask failures.
