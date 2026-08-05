# @repo/theme — Specification

Design token engine, semantic theme CSS variables, React theme provider, Tailwind CSS preset, and motion tokens.

## 1. Overview & Architecture

`@repo/theme` implements the canonical Arch System Glass UI specification. It enforces a strict 3-tier token hierarchy and exports light-only semantic CSS custom properties.

---

## 2. Exported Specification

### 2.1 Subpaths & Exports

- **`.`**: All design tokens (`colors`, `shadows`, `radii`, `motion`, `typography`), `ArchThemeProvider`, `useArchTheme`, `ThemeToggle`
- **`./css`**: Raw CSS files (`variables.css`, `glass.css`, `palette.css`, `cards.css`, `animations.css`)
- **`./tokens`**: TypeScript token constants
- **`./react`**: React context theme provider & theme switcher component
- **`./tailwind`**: Arch Tailwind CSS preset (`preset.ts`)
- **`./motion`**: Framer Motion animation variants and spring physics definitions

### 2.2 Token Tier Enforcement

1. **Primitive Tier:** Raw values (`--arch0`..`--arch15`, `--palette-*`).
2. **Semantic Tier:** Purpose-driven tokens (`--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--arch-glass-*`). Standard components use only Tier 2.
3. **Deprecated Tier:** Backward-compatibility tokens mapped to Tier 2.

### 2.3 Glass UI Tokens (`--arch-glass-*`)

- `--arch-glass-backdrop`: `blur(20px) saturate(180%)`
- `--arch-glass-surface`: Multi-stop linear gradient surface
- `--arch-glass-border`: `1px solid var(--palette-border-glass)`
- `--arch-glass-shadow`: Multi-layered specular and contact shadow system

---

## 3. Dependencies

- `devDependencies`: `tailwindcss` (`^3.4.17`), `@types/react` (`^19`), `typescript` (`^5.7.0`)
- `peerDependencies`: `react` (`^19.0.0`)
