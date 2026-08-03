---
name: agent-alignment-score
description: >-
  Formal Alignment Score owner (0–100) against AGENTS.md rubric. Use before
  claiming done, after multi-file changes, or when asked to score / check drift.
  Anti-trigger: do not replace sceptic adversarial review; do not emit score
  without evidence; do not use when user only wants lint/test (use quality skill).
---

# Agent Alignment Score

**Formal score owner.** `sceptic` gives adversarial verdict + estimate only; this skill emits the canonical score block.

## When to use

- Before marking non-trivial work complete
- User asks to score, align, check drift, or verify compliance
- After subagents return — synthesis gate before "done"

## Anti-triggers

- Do **not** substitute for `sceptic` review
- Do **not** guess dimension scores — cite evidence or score 0 on that dimension
- Do **not** claim PASS if `pnpm quality` (or scoped equivalent) was not run this session
- Do **not** own deployment, spec creation, or portal lint — delegate to those skills

## Workflow

1. Load rubric: [`references/rubric.md`](references/rubric.md)
2. Gather evidence (specs, diff, quality output, runtime/test proof)
3. Score each dimension; any AGENTS.md §18 never-do → hard fail (total 0). See [`references/never-dos.md`](references/never-dos.md)
4. Run CLI helper or emit block per [`references/gold-contract.md`](references/gold-contract.md)
5. If FAIL (< 80 or hard fail): list fixes; do not claim done

## Scripts

| Script                                                     | Purpose                       |
| ---------------------------------------------------------- | ----------------------------- |
| [`scripts/score.mjs`](scripts/score.mjs)                   | Compute and print score block |
| [`scripts/run-interactive.sh`](scripts/run-interactive.sh) | Interactive checklist         |

```bash
node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive
```

## References

- [`references/rubric.md`](references/rubric.md) — dimension weights and pass criteria
- [`references/gold-contract.md`](references/gold-contract.md) — required output format (extended block)
- [`references/extended-metrics.md`](references/extended-metrics.md) — code quality, pro bar, tokens
- [`references/gap-ledger.md`](references/gap-ledger.md) — why scores miss 100 and how to close
- [`references/never-dos.md`](references/never-dos.md) — §18 hard-fail list
- [Agent Skills Standard](../../standards/agent-skills/STANDARD.md) — project canonical
- Repeatable gaps → [`skill-self-improve`](../skill-self-improve/SKILL.md)
