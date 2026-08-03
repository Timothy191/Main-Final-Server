---
name: verify
description: >-
  Portal-scoped quality alias (quality skill in portal mode). Use after
  portal-only changes when full monorepo pnpm quality is unnecessary.
  Anti-trigger: do not claim full monorepo quality; do not replace sceptic,
  deploy, specs, or agent-alignment-score.
---

# Verify (alias → quality / portal)

Thin alias of `.qoder/skills/quality` in **portal** mode.

## Workflow

1. Run [`../quality/scripts/run-portal.sh`](../quality/scripts/run-portal.sh) — or this skill's wrapper:
   ```bash
   .qoder/skills/verify/scripts/run-portal.sh
   ```
2. Emit output per [`../quality/references/gold-contract.md`](../quality/references/gold-contract.md) with `Mode: portal`

For monorepo-wide gates, use `/quality` (full mode).

## References

- [`references/alias.md`](references/alias.md) — relationship to quality skill
