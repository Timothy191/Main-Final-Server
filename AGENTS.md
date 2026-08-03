# AGENTS.md — Global Agent Policy

This is the **canonical policy file for all agents** working in this repository
(Claude Code, Cursor, Codex, or any other). It is intentionally lean: it
establishes the cross-cutting rules every agent must follow and points to the
authoritative docs for each domain. Keep it short; put detail in the referenced
docs.

---

## Design system — a global rule

The portal's visual system (glass/transparency, background animation, all
tokens and visual aspects) is a **global rule**, not a suggestion. Every agent
that touches any visual surface in `apps/`, `packages/ui`, or `packages/theme`
**must**:

1. **Follow** [`docs/design-system/RULES.md`](./docs/design-system/RULES.md) —
   the enforceable must/must-not list (one glass schema; no ad-hoc
   `backdrop-blur-*` / `bg-white/` on panels or cards; token tiers; background
   animation is fixed; how to extend the schema).
2. **Apply** the canonical tokens and classes from
   [`docs/design-system/SPEC.md`](./docs/design-system/SPEC.md) — exact values
   for `--arch-glass-*`, `--os-shell-*`, `.glass-card`, `.os-shell--*`, the
   canvas/wave animation tokens, and every other token.
3. **Read** [`docs/design-system/DESIGN.md`](./docs/design-system/DESIGN.md) for
   intent, principles, surface roles, and the ambient background system before
   changing anything visual.

**When you change tokens, classes, or visual contracts, you must update the
docs in the same change:**

- Token value / new token / removed token → update **SPEC.md**.
- Structural decision (new variant, new role, schema change) → add an **ADR**
  in [`packages/theme/DECISIONS.md`](./packages/theme/DECISIONS.md) and update
  **DESIGN.md**.
- New / removed class → update the class catalog in **SPEC.md**.

Leaving these docs stale after a token change is a rule violation, equivalent to
leaving tests failing.

### Verification gate (mandatory before "done")

```bash
pnpm --filter @repo/theme lint:tokens              # token integrity (CI)
pnpm exec turbo run lint type-check test --force   # MUST be 0 cached
pnpm format:check
```

Do not trust a non-forced `pnpm quality` run — the `lint` task is turbo-cached
and can return a stale PASS.

---

## Other domain policies

- **Portal app (Next.js 16):** see [`apps/portal/CLAUDE.md`](./apps/portal/CLAUDE.md).
- **Codebase maps & runbooks:** [`docs/`](./docs/) (`docs/codebase-maps/`,
  `docs/runbooks/`, `docs/architecture/`).
- **Theme package mechanics (token generation, Style Dictionary, validation):**
  [`packages/theme/README.md`](./packages/theme/README.md) and ADRs in
  [`packages/theme/DECISIONS.md`](./packages/theme/DECISIONS.md).

## Two-layer policy

- **Product layer** (`apps/`, `packages/`): the monorepo business portal. All
  real work happens here.
- **Agentic layer** (`.cursor/`, `.agents/`, `.claude/`, etc.): agent
  infrastructure only. Do not let product code depend on it; do not commit agent
  runtime state.