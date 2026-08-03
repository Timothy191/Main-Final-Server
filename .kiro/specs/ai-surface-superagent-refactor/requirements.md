# Requirements: AI surface superagent refactor

## Intent

Improve workflows, skills, and agents via research-backed consolidation — without creating god-agents that destroy routing specificity.

## Acceptance criteria

1. External research informs KEEP vs MERGE (orchestrator–worker preferred over fewer superagents).
2. True duplicates are **aliased** to one canonical skill (`quality`); catalogs stop listing three peers as equals.
3. Similar agents are **not** flattened; they form documented **superagent families** under an orchestrator (`agency-lead`, `nextjs-fullstack`).
4. High-overlap pairs get sharper `Anti-trigger:` lines (especially `frontend-implementer` ↔ `nextjs-fullstack`).
5. Layout meta-skills stay separate; share a cross-ref index only.
6. `AGENTS.md` policy is mirrored, never soft-forked.
7. `.cursor/rules/04-subagent-auto-routing.mdc` stays accurate.
8. `pnpm ai check` passes after changes.

## Out of scope

- Merging `sceptic` with implementers or `security`
- Merging `frontend-design` + `frontend-implementer`
- Flattening Round-1 healing specialists into one file
- Deleting gold skills or fleet agents listed in AGENTS.md
