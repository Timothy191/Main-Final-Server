---
name: skill-self-improve
description: >-
  Hermes-style skill self-improvement: observe → distill → reuse → refine.
  MUST use after 3+ similar successes, complex tasks (5+ tool calls), error
  recovery, user corrections, or Alignment FAIL with a repeatable gap. Prefer
  patch over rewrite. Anti-trigger: do not invent AGENTS.md policy; do not
  duplicate skills; do not auto-commit secrets; do not replace sceptic or
  formal alignment score.
---

# Skill Self-Improve (Hermes loop)

Project-native clone of the Hermes learning loop for Arch Systems skills under `.cursor/skills/`.

## When to use

- Same workflow succeeded **3+** times this week (or documented in notes)
- Complex task with **5+** tool calls completed successfully
- Error recovery or user correction that should not be forgotten
- Alignment FAIL with a **repeatable** gap (see gap-ledger)
- Adaptive next line says `distill` or `patch`
- After a successful **Critique→Refine→Score** or edge-prune cycle (see [`_shared/references/swarm-edge-critique-refine.md`](../../agents/_shared/references/swarm-edge-critique-refine.md)) when Hermes criteria also match

## Anti-triggers

- Do **not** invent or soften `AGENTS.md` policy
- Do **not** create a skill that duplicates an existing one (dedupe first)
- Do **not** vendor DSPy/GEPA into packages (optional offline only — see hermes-loop)
- Do **not** replace `sceptic` or `agent-alignment-score`
- Do **not** append duplicate Usage History lines — single-line upsert only (see [`references/when-not-to.md`](references/when-not-to.md))

## Workflow

1. **Observe** — capture procedure, pitfalls, verify commands from the session
2. **Dedupe** — `scripts/skill-manage.sh list` + search existing skills
3. **Distill** — fill [`assets/SKILL-DISTILL-TEMPLATE.md`](assets/SKILL-DISTILL-TEMPLATE.md)
4. **Apply** — prefer `patch` over `create`:
   - `scripts/skill-manage.sh patch <name> <old> <new>`
   - `scripts/skill-manage.sh create <name>` (from template)
5. **Reuse** — ensure `description` frontmatter enables progressive disclosure (catalog-only until activated)
6. **Validate** — `pnpm ai check` (or skill-layout validate)

Details: [`references/hermes-loop.md`](references/hermes-loop.md) · Guards: [`references/when-not-to.md`](references/when-not-to.md)

## Scripts

| Script                                               | Purpose                                             |
| ---------------------------------------------------- | --------------------------------------------------- |
| [`scripts/skill-manage.sh`](scripts/skill-manage.sh) | `list` / `create` / `patch` under `.cursor/skills/` |

## Gold Standard Contract

```
Skill-self-improve: <create|patch|skip>
Target: .cursor/skills/<name>/
Next owner: parent — <one line>
```
