# @repo/ui Package Guidelines

**Purpose:** Shared React components using glass design system — reusable UI primitives for the portal.

## Package Overview

This package provides reusable React components that implement the Arch-System glass design system. Components are consumed primarily by `apps/portal` but should remain framework-agnostic where possible.

## Component Categories

### Glass Components
- `GlassCard` - Translucent card containers
- `GlassSkeleton` - Loading states with glass effect
- `MacMenuBar` - macOS-style menu bar
- `MacTitleBar` - macOS-style window title bar

### Form Components
- `Input` - Text input with glass styling
- `Checkbox` - Custom checkbox component
- `SecondaryButton` - Action button
- `AnimatedButton` - Animated button variant

### Data Display
- `KPI` - Key performance indicator cards
- `Table` - Data table with sorting/pagination
- `Pagination` - Pagination controls
- `Badge` - Status badges
- `Avatar` - User avatars

### Layout
- `DepartmentLayout` - Department-specific layout wrapper
- `PageHeader` - Consistent page headers
- `EmptyState` - Empty state displays

### Feedback
- `Toaster` - Toast notifications
- `Spinner` - Loading spinners
- `action-confirm-dialog` - Confirmation dialogs

## Critical Rules

### 1. Design System Compliance
- **ALL** components must follow [`docs/design-system/RULES.md`](../../docs/design-system/RULES.md)
- Use tokens from `@repo/theme` — never hardcode colors, spacing, or typography
- Glass/transparency patterns must pass the design ratchet gate

### 2. Component Contract Stability
- **PROPS** are the API — treat prop changes as breaking changes
- **NEVER** remove props without deprecation period
- **ALWAYS** provide default values for optional props
- Document prop changes in package changelog

### 3. Framework Agnosticism
- Components should work in Next.js, React, and other React frameworks
- Avoid Next.js-specific APIs (e.g., `useRouter`) in shared components
- Use callback props for framework-specific navigation

### 4. Styling Approach
- Use Tailwind CSS with `@repo/theme` tokens
- Use `clsx` and `tailwind-merge` for conditional classes
- Prefer composition over inheritance
- Keep component-specific styles in component files

## Change Impact

When changing UI components:
- **HIGH IMPACT:** Prop changes, component removal, breaking style changes
- **MEDIUM IMPACT:** Style refinements, new features, bug fixes
- **LOW IMPACT:** Documentation updates, type refinements

### Cross-Package Dependencies
This package is consumed by:
- `apps/portal/src/components/` - Portal-specific component composition
- `apps/portal/src/features/` - Feature module UI
- `packages/departments/ui/` - Department-specific UI variants

## Testing

```bash
# Currently no UI tests - consider adding:
# - Component rendering tests with @testing-library/react
# - Prop validation tests
# - Accessibility tests with jest-axe
# - Visual regression tests with Storybook
```

## Common Patterns

### Component structure
```typescript
import { cn } from '@repo/ui/lib/utils';
import { forwardRef } from 'react';

interface ComponentProps {
  className?: string;
  // ... other props
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-classes', className)}
        {...props}
      >
        {/* Component content */}
      </div>
    );
  }
);

Component.displayName = 'Component';
```

### Using theme tokens
```typescript
import { tokens } from '@repo/theme';

// Don't do this:
className="bg-blue-500 p-4"

// Do this:
className={`bg-[${tokens.colors.primary}] p-[${tokens.spacing.md}]`}
```

### Conditional styling
```typescript
import { cn } from '@repo/ui/lib/utils';

className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDisabled && 'disabled-classes',
  className
)}
```

## Design System Integration

### Glass Pattern Requirements
- Transparency: Must use RGBA or CSS variables for opacity
- Blur: Must use `backdrop-blur` for glass effect
- Border: Must use subtle borders for edge definition
- Shadows: Must use consistent shadow tokens

### Accessibility
- All interactive components must be keyboard navigable
- Use semantic HTML elements
- Provide ARIA labels where necessary
- Ensure color contrast meets WCAG AA standards

## Change Checklist

Before declaring done with UI component changes:
- [x] Component follows design system rules
- [x] Uses theme tokens (no hardcoded values)
- [x] Props are properly typed with TypeScript
- [x] Component is exported from `src/index.ts`
- [x] Updated package exports if adding new components
- [x] Tested in consuming app (apps/portal)
- [x] Checked for breaking prop changes
- [x] Updated design system docs if pattern changed
- [x] Added entry to `docs/REPO-CHANGE-INDEX.md`
- [x] Ran `pnpm --filter @repo/ui type-check`

## Component Addition Process

1. Create component file in `src/components/`
2. Follow component structure pattern
3. Add to `src/index.ts` exports
4. Update `package.json` exports if providing named export
5. Test in consuming application
6. Update documentation

## Performance Considerations

- Use `React.memo` for components that re-render frequently
- Lazy load heavy components with `React.lazy()`
- Avoid inline functions in render (use `useCallback`)
- Use CSS transforms/animations instead of JS animations where possible
