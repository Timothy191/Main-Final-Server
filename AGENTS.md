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
- **Supabase Architecture Policy (On-Premise / Local Self-Hosted):**
  All local development and site production deployments strictly use the **On-Premise / Local Self-Hosted Supabase Docker Stack** (`pnpm supabase:start`). Never introduce dependencies on external cloud project links or remote account configurations.
- **Method 1 Live Mirroring Policy (Turbopack HMR Standard):**
  All agents editing visual code, typography, or UI components in `apps/portal` or `@repo/ui` must rely on **Method 1 (Next.js Turbopack HMR on `http://localhost:3000`)** via `pnpm dev`. All UI modifications must immediately hot-reload in real-time on `http://localhost:3000` to mirror visual updates without requiring manual app restarts.

## Two-layer policy

- **Product layer** (`apps/`, `packages/`): the monorepo business portal. All
  real work happens here.
- **Agentic layer** (`.cursor/`, `.agents/`, `.claude/`, etc.): agent
  infrastructure only. Do not let product code depend on it; do not commit agent
  runtime state.

---

## Documentation — a global rule

Every agent **must use and update the docs** that govern the area it touches.
This is the same severity as the design-system rule: leaving docs stale after a
change is a rule violation, equivalent to leaving tests failing.

- **Before** changing a domain, read its authoritative docs (the
  [wayfinder](./docs/WAYFINDER.md) maps each concept → entry point → ADR/trace
  → how-to-extend).
- **In the same change** that introduces, removes, or redefines behavior,
  update every doc that describes the old behavior:
  - API/contract surface → `@repo/contract` + `@repo/errors` + the relevant
    `docs/codebase-maps/` map.
  - Visual token/class/contract → `docs/design-system/SPEC.md` (+ ADR in
    `packages/theme/DECISIONS.md` for structural changes), per the design-system
    rule above.
  - Architecture/structure decision → add an ADR in
    [`packages/theme/DECISIONS.md`](./packages/theme/DECISIONS.md) (visual) or a
    note in [`docs/architecture/`](./docs/architecture/) (non-visual).
  - Anything an agent would need to know next → an `AGENT-TRACE:` breadcrumb in
    the code and an entry in the app's `AGENT_TRACER.md`.
- **Update the [repo change index](./docs/REPO-CHANGE-INDEX.md)** for every
  change (see below).

If a doc contradicts the code, fix one or the other in the same change — never
leave the contradiction for the next agent.

## Repo change index — a global rule

[`docs/REPO-CHANGE-INDEX.md`](./docs/REPO-CHANGE-INDEX.md) is the **canonical,
append-only log of every change** to the repo. Every agent must append one entry
per change (one per commit is fine) before declaring the work done. An entry is
not optional prose — it is the record that the change happened and where to find
it next time.

Entry format (append to the table, newest at top):

| Date | Agent | Area | Summary | Files | Docs updated |
| --- | --- | --- | --- | --- | --- |

- **Area** matches a wayfinder concept where possible (e.g. `acl`, `errors`,
  `design-system`, `cache`, `portal/auth`).
- **Docs updated** lists every doc changed in the same commit (SPEC.md, ADR,
  codebase map, AGENT_TRACER.md, etc.) — `none` is a red flag, not an answer.
- This index is the temporal companion to the structural
  [wayfinder](./docs/WAYFINDER.md): the wayfinder says *what is here*, the
  change index says *how it got here*.

---

## Documentation Hygiene — Removal & Maintenance Rule

All notes, citations, scratch files, and markdown documentation (`*.md`) across the repository must follow strict hygiene:

1. **Remove Unimportant & Stale Files**: Any temporary notes, obsolete citations, duplicate plan documents, or scratch markdown files that are no longer relevant, active, or authoritative **must be removed immediately**.
2. **Keep Important Documentation Updated**: Any markdown document that is retained as part of the architecture, runbooks, codebase maps, or design system **must be updated** in the same change whenever code, signatures, or system behaviors change.
3. **No Unmaintained Artifacts**: Never leave abandoned, out-of-date, or speculative documentation behind.