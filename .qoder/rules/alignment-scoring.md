---
description: Alignment scoring + real-world logic — mirrors AGENTS.md §20
globs: ["**/*"]
---

# Alignment & Scoring (No Drift)

Canonical policy: `AGENTS.md` §20. Cursor: `.cursor/rules/02-agent-scoring.mdc`.

## Thought process

```
OBSERVE → HYPOTHESIZE → VERIFY → ACT → SCORE
```

No speculation-as-fact. Verify with tools before acting.

## Score before "done"

Pass ≥ 80. §18 never-do → hard fail (0).

```
Alignment: <score>/100 [<PASS|FAIL>]
- Spec / Stack / Boundaries / Security / Quality / Verify
Hard fails: <none | list>
```

```bash
node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive
```
