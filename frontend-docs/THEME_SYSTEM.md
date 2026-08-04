# Theme System Documentation

The Arch System theme is a **custom, light-only, macOS-style frosted-glass**
design system. It is not derived from shadcn/ui or Material UI, but it includes
compatibility variables so shadcn/Tremor components can be dropped in and re-themed
without breaking the visual contract.

## Packages

| Package       | Path             | Responsibility                                |
| ------------- | ---------------- | --------------------------------------------- |
| `@repo/theme` | `packages/theme` | Tokens, CSS, Tailwind preset, theme provider. |
| `@repo/ui`    | `packages/ui`    | React components that consume the theme.      |
| `apps/portal` | `apps/portal`    | Application pages and local components.       |

## Token architecture

Tokens follow a strict three-tier system (ADR #007):

### Tier 1 — Primitives

Raw palette values. **Never reference these directly in components or utilities.**

- CSS: `--arch0`…`--arch15`
- CSS: `--palette-*` (defined in `packages/theme/src/css/palette.css`)
- TS: `colors.ts`, `palette.ts`, `tokens.json`

Examples:

```css
--arch0: var(--palette-surface-elevated);
--arch13: var(--palette-brand-primary);
```

### Tier 2 — Semantic

The only tier components and utilities may reference.

```css
--bg-primary: var(--arch0);
--bg-secondary: var(--arch1);
--bg-tertiary: var(--arch2);
--border-subtle: var(--arch4);
--border-default: var(--arch5);
--border-emphasis: var(--arch6);
--text-muted: var(--arch8);
--text-secondary: var(--arch9);
--text-body: var(--arch10);
--text-primary: var(--arch11);
--accent-charcoal: var(--arch13);
--accent-red: var(--arch12);
--accent-green: var(--arch14);
```

Plus the glass family:

```css
--arch-glass-backdrop: blur(20px) saturate(180%);
--arch-glass-surface: linear-gradient(...), rgba(255, 255, 255, 0.15);
--arch-glass-surface-hover: ...;
--arch-glass-border: 1px solid var(--palette-border-glass);
--arch-glass-shadow: ...;
```

### Tier 3 — Deprecated

Do not introduce new usage. Migrate-on-touch.

- `--accent-cyan`, `--accent-indigo`, `--accent-violet` → `--accent-charcoal`
- `--accent-alert` → `--accent-red`
- `--bg-void` → `--bg-primary`

## Canonical glass schema

Every frosted-glass surface derives from `--arch-glass-*`. Two roles consume it:

### 1. OS chrome (`--os-shell-*`)

For taskbars, docks, login cards, full-height panels, hub panels, `AlertTicker`,
`ToolBanner`.

Classes: `.os-shell`, `.os-shell--taskbar`, `.os-shell--dock`, `.os-shell--login`,
etc. in `packages/theme/src/css/glass.css`.

### 2. Content cards (`.glass-card` / `GlassCard`)

For KPI cards, department cards, dashboards, tables.

Class `.glass-card` in `packages/theme/src/css/cards.css` and `GlassCard` React
component in `packages/ui/src/components/GlassCard.tsx`.

### Rules

- Use `.os-shell*` for chrome.
- Use `GlassCard` / `.glass-card` for content cards.
- Do **not** add `backdrop-blur-*`, `backdrop-saturate-*`, or raw opacity fills
  like `bg-white/20` to a panel or card body.
- Department colors are applied via safelisted Tailwind classes (`text-blue-500`,
  etc.), not CSS variables (ADR #004).

## Files

### CSS source of truth

| File                                             | Purpose                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `packages/theme/src/css/palette.css`             | `--palette-*` primitive values.                                         |
| `packages/theme/src/css/variables.css`           | Semantic tokens, glass tokens, HSL compatibility, Tremor compatibility. |
| `packages/theme/src/css/variables-generated.css` | Generated output from Style Dictionary. Do not edit by hand.            |
| `packages/theme/src/css/glass.css`               | `.os-shell*` chrome classes and glass utilities.                        |
| `packages/theme/src/css/cards.css`               | `.glass-card`, `.glass-depth-card`, card variants.                      |
| `packages/theme/src/css/animations.css`          | Background/ambient animations and motion utilities.                     |
| `packages/theme/src/css/focus.css`               | Focus rings and accessibility outlines.                                 |
| `packages/theme/src/css/transitions.css`         | Shared transition curves.                                               |
| `packages/theme/src/css/reset.css`               | Base reset.                                                             |
| `packages/theme/src/css/index.css`               | Barrel import of all theme CSS.                                         |

### TypeScript / JSON tokens

| File                                        | Purpose                                   |
| ------------------------------------------- | ----------------------------------------- |
| `packages/theme/src/tokens/colors.ts`       | Color token definitions.                  |
| `packages/theme/src/tokens/palette.ts`      | Palette primitives.                       |
| `packages/theme/src/tokens/glass.ts`        | Glass token definitions.                  |
| `packages/theme/src/tokens/radii.ts`        | Radius scale.                             |
| `packages/theme/src/tokens/shadows.ts`      | Shadow tokens.                            |
| `packages/theme/src/tokens/typography.ts`   | Typography tokens.                        |
| `packages/theme/src/tokens/motion.ts`       | Motion curves.                            |
| `packages/theme/src/tokens/index.ts`        | Barrel export.                            |
| `packages/theme/src/tokens/tokens-hsl.json` | HSL token data.                           |
| `packages/theme/src/tokens/generated.ts`    | Generated token map. Do not edit by hand. |
| `packages/theme/src/tokens/generated-sd.ts` | Style Dictionary generated output.        |

### Tailwind integration

| File                                      | Purpose                                                              |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `packages/theme/src/tailwind/preset.ts`   | Tailwind preset exporting colors, shadows, radii, fonts, animations. |
| `packages/theme/src/tailwind/tokens.json` | Tailwind token input.                                                |
| `apps/portal/tailwind.config.ts`          | Re-exports `@repo/theme/tailwind`.                                   |

## React theme provider

- `packages/theme/src/react/theme-provider.tsx` — `ArchThemeProvider`.
- `packages/ui/src/components/DesignSystemProvider.tsx` — composes
  `ArchThemeProvider` + error boundary.

Application root should wrap with `DesignSystemProvider`:

```tsx
import { DesignSystemProvider } from '@repo/ui'

export default function RootLayout({ children }) {
  return <DesignSystemProvider>{children}</DesignSystemProvider>
}
```

## shadcn/ui compatibility

The theme intentionally exposes shadcn HSL variables so shadcn components can be
dropped in and re-themed:

```css
--background: 240 5% 96%;
--foreground: 240 6% 10%;
--card: 0 0% 100%;
--primary: 240 6% 10%;
--secondary: 240 5% 91%;
--muted: 240 5% 91%;
--accent: 240 5% 91%;
--destructive: 3 78% 46%;
--border: 240 6% 87%;
--input: 240 5% 91%;
--ring: 240 6% 10%;
--radius: 0.75rem;
```

However, **shadcn components must be re-styled** to use `--arch-glass-*`,
`--os-shell-*`, and the light-only palette. Do not use them as-is.

## Tremor compatibility

Tremor chart tokens are also included for `recharts` and any Tremor widgets:

```css
--tremor-brand-faint: 240 5% 96%;
--tremor-brand-muted: 240 5% 90%;
...
```

## Modifying the theme

1. Edit the source file (`variables.css` for semantic values, `palette.css` for
   primitives, or the relevant TS file).
2. Update `docs/design-system/SPEC.md` with the new value.
3. If the change is structural (new surface role, new token tier), add an ADR to
   `packages/theme/DECISIONS.md`.
4. Regenerate generated files if needed:
   ```bash
   pnpm exec turbo run codegen --filter @repo/theme --force
   ```
5. Run verification:
   ```bash
   pnpm --filter @repo/theme lint:tokens
   pnpm design:ratchet
   pnpm theme:shape
   pnpm exec turbo run lint type-check test --force
   pnpm format:check
   ```

## Common mistakes

- **Editing `generated.ts` or `variables-generated.css` by hand.** These are
  build outputs; changes will be overwritten.
- **Using `--arch0` directly in a component.** Go through `--bg-primary` or the
  Tailwind `bg-primary` utility.
- **Adding `dark:` variants.** The system is light-only.
- **Hand-rolling glass on a panel/card.** Use `.os-shell` or `GlassCard` instead.
- **Running `pnpm --filter @repo/theme codegen` just to change a CSS value.**
  `codegen` regenerates the token map; it is not needed for value-only edits and
  can break tests by dropping primitives.
