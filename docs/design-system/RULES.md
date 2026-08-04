# Design System — Global Agent Rules

> **This file is a global rule for the Arch-System codebase.** Every agent
> (Claude Code, Cursor, Codex, or any other) working in `apps/`, `packages/ui`,
> or `packages/theme` **must** follow these rules, **apply** them when touching
> any visual surface, and **update** DESIGN.md / SPEC.md / DECISIONS.md when
> tokens or visual contracts change. Treat these as hard constraints, not
> suggestions — the token validator (`packages/theme/scripts/validate-tokens.mjs`)
> and the quality gate enforce the mechanical parts; the rest is enforced at
> review.

**Canonical references**

- Design: [`docs/design-system/DESIGN.md`](./DESIGN.md)
- Specification (exact tokens & classes): [`docs/design-system/SPEC.md`](./SPEC.md)
- Architectural decisions (ADRs): [`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md)
- Source of truth for tokens: `packages/theme/src/css/variables.css` (+ `variables-generated.css`)
- Source of truth for classes: `packages/theme/src/css/glass.css` / `cards.css` / `animations.css`

---

## R1 — One glass schema

All frosted-glass surfaces derive from the **canonical glass schema**
(`--arch-glass-*` in `variables.css`): one backdrop (`blur(20px) saturate(180%)`),
one gradient surface, one border, one shadow stack. `--os-shell-*` (chrome)
and `.glass-card` (content cards) both resolve to it.

- **Chrome** (taskbar, dock, login card, full-height panel shells, hub panels,
  AlertTicker, ToolBanner): use `.os-shell` + the relevant `.os-shell--*` variant.
- **Content cards**: use `GlassCard` (or the `.glass-card` / `.glass-depth-card`
  classes directly for non-component cases).
- **Role-specific shape only**: radius/shape may differ by role (taskbar pill,
  cards `--radius-card`, panels square). The _effect_ (translucency, blur,
  saturate, border, shadow) must not differ.

## R2 — No ad-hoc glass

Do **not** hand-roll glass on panels or cards. Specifically, do not add these
to a panel/card/card-shell surface:

- `backdrop-blur-*` / `backdrop-saturate-*` Tailwind utilities (they re-assert
  `backdrop-filter` and override the canonical `.glass-card` / `.os-shell`
  backdrop, breaking the shared blur).
- Raw opacity fills such as `bg-white/40`, `bg-white/70`, `bg-arch1/50`,
  `bg-arch-surface-secondary/80`, `bg-[var(--vibrancy-surface)]` as a _surface
  treatment_. (These are fine for transient overlays/scrims — see R4 — never for
  a panel or card body.)
- Inline `style={{ background: 'rgba(255,255,255,…)' }}` for a glass fill.

If a surface needs glass, put the canonical class on it. If the existing
classes don't fit, extend the schema (R6) — do not invent a one-off.

## R3 — Use the token tiers

Follow the three-tier system (DECISIONS #007):

- **Primitive** (`--arch0`…`--arch15`, `--palette-*`): raw values only. Never reference them in components or in `preset.ts` semantic sections.
- **Semantic** (`--bg-*`, `--text-*`, `--border-*`, `--accent-*`, `--arch-glass-*`,
  `--os-shell-*`, `--glass-*`, `--radius-*`, `--shadow-*`, `--canvas-*`, `--wave-*`, …
  }: the only tier components/utilities may use. Light-only set in `:root`.
- **Deprecated** (`--accent-cyan/indigo/violet/alert/blue/emerald`, `--bg-void`):
  Map to canonical Tier 2. Stylelint warns. Migrate-on-touch; do not introduce new usages.

## R4 — Transient surfaces are out of scope (but stay light)

Menus, dropdowns, popovers, tooltips, modals, scrims, avatars, and skeleton
shimmers are **transient surfaces**, not "panels." They may keep their own
lighter treatment (`bg-white/90` + `backdrop-blur-2xl` etc.) — they are not
required to adopt `.os-shell`. Do not file-migrate them en masse; only align one
if it visually clashes with the canonical schema and the change is requested.

## R5 — Background animation is fixed

The global ambient background is the single `RouteBackground` component: one
muted, looping H.264 wave at 0.65× with keep-alive, CSS fallback orbs, tint,
grain, and shimmer, honoring `prefers-reduced-motion`. Do not:

- Add a second competing background/animation on a page.
- Hard-code a page-level `<video>` or CSS backdrop that overlaps the ambient layer.
- Change the playback rate / source path outside `RouteBackground.tsx` + the
  tokens (`--canvas-*`, `--wave-*`, `animate-wave-canvas-*`).

To theme a page's ambient feel, adjust the `--canvas-*` / `--wave-*` tokens or
the orb classes — not the video.

## R6 — Extending the schema

When a genuinely new surface role is needed (e.g. a new chrome variant):

1. Add the token(s) to the canonical `--arch-glass-*` family in `variables.css`
   (derive, don't duplicate values) — or add a new `.os-shell--*` variant in
   `glass.css` that references canonical tokens.
2. Add or update the class in `glass.css` / `cards.css` / `animations.css`.
3. **Update SPEC.md** with the new token/class and its exact value.
4. Add an ADR to `packages/theme/DECISIONS.md` if the change is structural.
5. Re-run the validator and the quality gate (R7).

## R7 — Verification (mandatory before claiming "done")

```bash
# Token integrity (CI gate)
pnpm --filter @repo/theme lint:tokens

# Design-system ad-hoc-glass ratchet (standalone — not turbo-cached, so no
# stale PASS). Fails when a banned-pattern category count regresses over the
# baseline in tools/design-ratchet.baseline.json. See R2.
pnpm design:ratchet

# generated.ts shape guard — fails if the committed token map loses its
# baseline shape (e.g. someone ran generate-tokens.mjs, which drops --arch*
# primitives). See memory: theme-generated-ts-drift.
pnpm theme:shape

# Quality gate — MUST be forced + 0 cached (turbo caches stale lint PASS)
pnpm exec turbo run lint type-check test --force   # confirm "0 cached"
pnpm format:check
```

Do not claim a green quality gate from a non-forced `pnpm quality` run —
the `lint` task is turbo-cached and can return a stale PASS. (See the
`turbo-eslint-cache-masking` memory.) The ratchet and shape guard are
standalone scripts precisely so they sidestep that cache.

## R8 — Update these docs when you change the system

- Token value changed / token added or removed → update **SPEC.md** and, if
  Style Dictionary-driven, regenerate (`pnpm --filter @repo/theme codegen`).
- Structural decision (new variant, new role, schema change) → add an **ADR**
  in `DECISIONS.md` and update **DESIGN.md**.
- Class added/removed → update the class catalog in **SPEC.md**.
- Leaving these docs stale after a token change is a rule violation, same as
  leaving tests failing.

## R9 — Token Maintenance Workflow

### Validation Steps

Before committing any token changes:

```bash
# 1. Validate token structure
pnpm --filter @repo/theme lint:tokens

# 2. Regenerate derived outputs (if needed)
pnpm exec turbo run codegen --filter @repo/theme --force

# 3. Run shape guard
pnpm theme:shape

# 4. Full quality gate (forced, 0 cached)
pnpm exec turbo run lint type-check test --force
pnpm format:check
```

### CI Checks

The CI pipeline enforces these checks:

- **Token validation**: `scripts/validate-tokens.mjs` verifies:
  - No duplicate token definitions
  - All required tokens are present
  - Color values are valid CSS colors
  - Deprecated tokens have proper mappings
- **Design ratchet**: `tools/design-ratchet.mjs` ensures no banned glass patterns
  are introduced
- **Shape guard**: verifies `generated.ts` maintains its structure

### Token Update Process

1. **Edit source tokens**: Modify `packages/theme/src/css/variables.css` or
   `packages/theme/src/css/palette.css`
2. **Regenerate output**: Run `pnpm --filter @repo/theme codegen` to update:
   - `src/tokens/generated.ts`
   - `src/tokens/palette.ts`
   - `src/css/variables-generated.css`
3. **Validate**: Run `pnpm theme:shape` and `pnpm --filter @repo/theme lint:tokens`
4. **Update documentation**: Update **SPEC.md** with any new/changed tokens
5. **Commit**: Include token changes and documentation updates together

### Common Validation Errors

| Error           | Cause                                  | Fix                                  |
| --------------- | -------------------------------------- | ------------------------------------ |
| Duplicate token | Token defined twice in `variables.css` | Remove duplicate definition          |
| Missing mapping | Semantic token not mapped to primitive | Add proper mapping in Tier 2 section |
| Invalid color   | Hex/RGB/HSL value malformed            | Fix color syntax                     |
| Shape drift     | `generated.ts` structure changed       | Regenerate with codegen script       |

---

## R10 — Platform-Specific Details

The design system is optimized for the System environment, with the following platform-specific
tokens and classes:

### Chrome Tokens

- `--mac-red`: `#ff5f56` — Traffic light red (matches system)
- `--mac-yellow`: `#ffbd2e` — Traffic light yellow
- `--mac-green`: `#27c93f` — Traffic light green
- `--menu-bar-height`: `28px` — System menu bar height

### UI Patterns

**Login Card (System-style):**

- Uses `.os-shell--login` with 24px rounded corners
- Dark ambient wallpaper behind Liquid Glass card
- Gold focus ring (`--login-focus-gold-*`) for interactive elements
- Centered, fixed-width card (max-width: 26.25rem)

**Dock Implementation:**

- Bottom-aligned panel using `.os-shell--dock`
- Rounded corners for full-height shell
- Centered icon arrangement

**Menu Bar Integration:**

- Taskbars use pill shape with `.os-shell--taskbar`
- Respects `--menu-bar-height` for positioning
- Ultra-translucent fill (`--os-shell-taskbar-surface`)

### System-Specific Styles

```css
/* System-specific overrides in glass.css */
.os-shell--login {
  /* Login-specific styling */
}

.login-focus-gold-ring {
  /* Gold focus ring for System-like UI */
}
```

### Lockup UI

The login interface follows System conventions:

- Liquid Glass card over dark ambient
- Centered branding with wordmark
- Traffic light red/yellow/green indicators
- Focus ring uses gold (`--login-focus-gold-*`) rather than blue
- Password field shows reveal/hide toggle with proper spacing
