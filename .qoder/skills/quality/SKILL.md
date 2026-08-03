---
name: quality
description: >-
  Full monorepo quality gate (lint + type-check + test + format) or portal-scoped
  mode. Use before marking work complete, pre-commit, or when verifying changes.
  Anti-trigger: do not replace sceptic adversarial review or agent-alignment-score;
  do not use portal mode to claim full monorepo quality; do not deploy.
---

# Quality Gate

Single quality skill with two modes. Prefer **full** before claiming done on multi-package work.

## Mode selection

| Mode             | When                               | Script                  |
| ---------------- | ---------------------------------- | ----------------------- |
| `full` (default) | Mark complete, pre-commit, release | `scripts/run-full.sh`   |
| `portal`         | Portal-only change                 | `scripts/run-portal.sh` |

`/verify` is an alias of this skill in **portal** mode.

## Workflow

1. Pick mode — see [`references/modes.md`](references/modes.md)
2. Run the matching script from repo root
3. On format failure (full mode): `pnpm format`, then re-run
4. Emit output per [`references/gold-contract.md`](references/gold-contract.md)

## Scripts

```bash
.qoder/skills/quality/scripts/run-full.sh
.qoder/skills/quality/scripts/run-portal.sh
```

## References

- [`references/modes.md`](references/modes.md) — full vs portal commands
- [`references/gold-contract.md`](references/gold-contract.md) — required output template
