# Hermes-style learning loop (project native)

Inspired by [Hermes learning loop](https://hermes-agent.ai/features/learning-loop) and [agentskills.io progressive disclosure](https://agentskills.io/home). Optional offline evolution: [NousResearch/hermes-agent-self-evolution](https://github.com/NousResearch/hermes-agent-self-evolution) (DSPy+GEPA) — **not** vendored here.

## Cycle

```
OBSERVE → DISTILL → REUSE → REFINE
```

1. **Observe** — tool calls, decisions, corrections, verify evidence
2. **Distill** — after 3+ similar successes or one complex (5+ tools) success / error recovery → SKILL.md procedure
3. **Reuse** — Adaptive next `reuse` means: patch an existing skill/checklist (progressive disclosure); do **not** create a twin skill. Catalog metadata always; full body only on activation
4. **Refine** — prefer **patch** (surgical) over edit/rewrite; delete only if obsolete and deduped

## Priority order (Hermes skill_manage)

1. Patch the skill already loaded for this task
2. Patch an existing skill in the same category
3. Create a new skill only if no fit

## Progressive disclosure (token savings)

| Tier       | Load                      | Cost                 |
| ---------- | ------------------------- | -------------------- |
| 1 Catalog  | name + description        | ~50–100 tokens/skill |
| 2 Activate | full SKILL.md             | keep lean            |
| 3 Execute  | scripts/references/assets | on demand            |

## This repo layout

Skills live at `.cursor/skills/<name>/SKILL.md` (hybrid with scripts/references/assets). Validate with `pnpm ai check`.
