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

- **Primitive** (`--arch0`…`--arch15`): raw values only. Never reference them in
  components or in `preset.ts` semantic sections.
- **Semantic** (`--bg-primary`, `--text-body`, `--shadow-card`, `--arch-glass-*`,
  `--os-shell-*`, `--glass-*`, …): the only tier components and utilities may use.
- **Deprecated** (`--accent-cyan/indigo/violet/alert/blue/emerald`, `--bg-void`):
  Stylelint warns. Migrate-on-touch; do not introduce new usages.

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

To theme a page's ambient feel, adjust the `--canvas-wave-tint-*` / `--wave-*`
tokens or the orb classes — not the video.

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

Do not claim a green quality gate from a non-forced `pnpm quality` run — the
`lint` task is turbo-cached and can return a stale PASS. (See the
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
