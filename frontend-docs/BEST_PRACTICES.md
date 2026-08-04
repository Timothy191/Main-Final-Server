# Frontend Best Practices

Rules, verification steps, and conventions for working on the Arch System
frontend.

## 1. Use the design system tokens

- Reference **semantic** tokens only (`--bg-*`, `--text-*`, `--border-*`,
  `--accent-*`, `--arch-glass-*`, `--os-shell-*`, `--glass-*`, `--radius-*`,
  `--shadow-*`).
- Never use primitive `--arch0`…`--arch15` or `--palette-*` directly in
  components or utilities.
- Never hard-code `rgba(...)` or `bg-white/20` for a card/panel surface.
- Use the Tailwind preset colors (`bg-primary`, `text-arch-text-primary`,
  `border-arch-border-default`) rather than arbitrary `bg-[var(--...)]` unless the
  token is not mapped.

## 2. Respect the glass roles

| Surface role                           | Correct tool                                                |
| -------------------------------------- | ----------------------------------------------------------- |
| Content card                           | `GlassCard` / `.glass-card`                                 |
| OS chrome (taskbar, dock, panel shell) | `.os-shell*`                                                |
| Modal/dialog body                      | `GlassCard` / `.glass-card` styled wrapper                  |
| Scrim/backdrop                         | transient — `bg-black/60 backdrop-blur-sm` is allowed       |
| Menu/popover/tooltip                   | transient — keep lighter treatment, no `.os-shell` required |

Do not add `backdrop-blur-*` or raw opacity fills to a panel/card body.

## 3. Prefer canonical component paths

```tsx
// Good
import { Button } from '@repo/ui/components/ui/button'
import { GlassCard } from '@repo/ui/GlassCard'
import { EmptyState } from '@repo/ui/components/ui/states'

// Avoid (legacy)
import { SecondaryButton } from '@repo/ui'
```

## 4. Keep components server-renderable unless they need the client

- Only add `'use client'` when the component uses state, effects, browser APIs,
  or event handlers.
- Loading/empty/error states in `packages/ui/src/components/ui/states.tsx` are
  intentionally server-renderable.
- RevoGrid's `DataGrid` requires client-side dynamic import.

## 5. Forms

Until a formal `Form` primitive exists, use:

- `Input` from `@repo/ui/components/ui/input`
- `FormFields.tsx` (`FormInput`, `FormSelect`, `FormTextarea`, `FormError`) for
  labeled/error-wrapped controls
- Server Actions + `useFormStatus` from `react-dom` for submission state

Avoid hand-writing raw `<input>` with inline styles in page components.

## 6. Light-only

- No `dark:` Tailwind variants.
- No dark-mode media queries in CSS.
- The login page may have a dark **backdrop** image, but the chrome remains light
  frosted glass.

## 7. Accessibility

- All interactive components must have keyboard support and visible focus
  indicators.
- Use Radix primitives for complex overlays (Dialog, DropdownMenu, Popover,
  Tooltip, Select, Checkbox, Switch, RadioGroup).
- Prefer `aria-labelledby` + `aria-describedby` over generic labels.
- Test with `pnpm test` (Jest + Testing Library).

## 8. Animation

- Use `framer-motion` for complex animations.
- Honor `prefers-reduced-motion` (the theme CSS already provides
  `motion-reduce:*` utilities).
- Do not add a second global background; the single `RouteBackground` is the
  source of truth for ambient motion.

## 9. Icons

Use `lucide-react` only. Avoid mixing icon libraries.

## 10. Department colors

Apply department colors via safelisted Tailwind classes (`text-blue-500`,
`bg-emerald-500`, etc.), not CSS variables. The safelist is in the portal
Tailwind config.

## 11. Verification before claiming done

Every frontend change must pass:

```bash
# 1. Token integrity
pnpm --filter @repo/theme lint:tokens

# 2. Ad-hoc-glass ratchet (must not regress baseline)
pnpm design:ratchet

# 3. Generated token-map shape guard
pnpm theme:shape

# 4. Forced lint/type-check/test (confirm "0 cached")
pnpm exec turbo run lint type-check test --force

# 5. Formatting
pnpm format:check
```

If you changed only markdown docs, run `pnpm format:check` at minimum.

## 12. Commit conventions

Follow conventional commits and include `Co-Authored-By: Claude <noreply@anthropic.com>`
when staging changes. Stage only files you edited.

## 13. Documentation

Update docs whenever you change the system:

- New/removed component → `frontend-docs/COMPONENT_CATALOG.md`
- Token value/class change → `docs/design-system/SPEC.md`
- Structural decision → `packages/theme/DECISIONS.md` (ADR)
- shadcn adoption pattern → `frontend-docs/MIGRATION_GUIDE.md`

## 14. Agent tracing

For significant frontend work, update:

- `docs/REPO-CHANGE-INDEX.md`
- `.agents/AGENT_TRACER.md`
- `apps/portal/AGENT_TRACER.md`
- Leave `// AGENT-TRACE:` breadcrumbs in code.

## 15. What to do when in doubt

1. Read `docs/design-system/RULES.md`.
2. Read `frontend-docs/THEME_SYSTEM.md`.
3. Run `pnpm --filter @repo/theme lint:tokens` to see token violations.
4. Run `pnpm design:ratchet` to see glass violations.
5. Ask before introducing a new dependency.
