# Shared Agent Knowledge Base (Repowiki)

This is the **single source of truth for cross-agent knowledge** about this codebase.
Every AI agent working in this repo (Claude, Cursor, Qoder, Gemini, Copilot, Serena,
and any future tool) reads from and writes to this directory so understanding is shared
and consistent instead of siloed in per-tool memory.

- Canonical policy that points here: root [`AGENTS.md`](../../AGENTS.md) -> "Shared Knowledge Base".
- Enforced by `pnpm ai check` (see [`scripts/ai.sh`](../../scripts/ai.sh) Phase 2 guardrails).
- Physically separate from product source, per the `.agents/` charter ([`.agents/README.md`](../README.md)).

## Layout

| Path | Contents |
| --- | --- |
| [`index.md`](index.md) | Navigable table of contents — update whenever you add a doc |
| `architecture/` | Durable understanding of how the system is built (boundaries, data flow, subsystems) |
| `decisions/` | Global ADR-lite log — numbered, append-only decisions |
| `patterns/` | Reusable solutions, gotchas, and recipes promoted from real work |
| [`glossary.md`](glossary.md) | Shared domain + codebase vocabulary |

## Entry format

Every Markdown entry starts with YAML frontmatter:

```yaml
---
title: Short descriptive title
tags: [portal, auth, supabase]
updated: 2026-07-21
source_agent: <tool/agent that wrote or last changed this, e.g. claude-code>
status: active # active | superseded
---
```

Decision entries additionally follow the format used in
[`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md):
`## NNN — Title` with **Decision**, **Why**, and **Status** subsections.

## Protocol

**READ** (before non-trivial work):

1. Open [`index.md`](index.md).
2. Read the relevant `architecture/`, `patterns/`, and `decisions/` entries for the area
   you are touching.

**WRITE** (when you learn something durable — an architectural fact, a non-obvious
gotcha, or a decision):

1. Add or update the entry using the frontmatter above.
2. Cite evidence: link the exact file path(s) that ground the claim (for example
   `apps/portal/proxy.ts`). This matches the `SOUL.md` evidence contract.
3. Bump `updated` to today and set `source_agent`.
4. Update [`index.md`](index.md) so the entry is discoverable.

**SUPERSEDE, NEVER DELETE:**

- When knowledge becomes stale, set `status: superseded` on the old entry and link the
  successor. History stays in git and remains diff-reviewable.

## Scope

- **In scope:** durable understanding of _this_ codebase useful to any agent.
- **Out of scope:**
  - End-user product memory — that is the runtime `memory_embeddings` feature in
    [`packages/database/migrations/009_ai_memory.sql`](../../packages/database/migrations/009_ai_memory.sql),
    whose RLS is scoped to `auth.uid()` / end users. Do not store agent-dev notes there.
  - Transient session logs — those stay in per-tool stores (e.g. `.claude/memory/`).

## Access from tools

Tool-specific paths are symlinks to this directory, created by
[`.claude/scripts/sync-surfaces.sh`](../../.claude/scripts/sync-surfaces.sh):

- `.claude/knowledge` -> `.agents/knowledge`
- `.cursor/knowledge` -> `.agents/knowledge`
- `.qoder/repowiki` -> `.agents/knowledge`

Run `.claude/scripts/sync-surfaces.sh` (or `pnpm ai fix`) after cloning to (re)create them.
