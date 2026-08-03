---
name: skill-layout
description: >-
  Meta-skill for creating or refactoring skills to the Agent Skills open standard
  (agentskills.io). Use when adding a skill, reorganizing SKILL.md, auditing
  layout, or installing external skills. Anti-trigger: do not replace agent
  orchestration or sceptic review.
---

# Skill Layout Standard

**Canonical reference:** [`.cursor/standards/agent-skills/STANDARD.md`](../../standards/agent-skills/STANDARD.md)

Every project skill follows the [Agent Skills open standard](https://agentskills.io/home).

## Required structure

```
skill-name/                 # kebab-case folder name
├── SKILL.md                # YAML frontmatter + lean workflow
├── scripts/                # .sh / .py / .mjs — executed during task
├── references/             # detailed docs — read on demand
└── assets/                 # templates, configs — static inputs (optional)
```

## SKILL.md rules

1. Frontmatter: `name`, `description` (imperative when-to-use + anti-triggers; ≤1024 chars)
2. Body: workflow, links to scripts/references/assets — lean core only
3. Keep ≤ ~60 lines in project skills — depth in `references/` (official max ~500 lines / 5k tokens)

## Runtime (all agents)

1. Session start → read skill `*.md`
2. Task match → follow `SKILL.md`
3. Execute `scripts/`; read `references/` and `assets/` as prescribed

## Validate

```bash
.cursor/skills/skill-layout/scripts/validate.sh
```

## Install external skills

```bash
npx skills find <query>
npx skills add <owner/repo>
```

## This repo paths

| Surface        | Path              |
| -------------- | ----------------- |
| Cursor         | `.cursor/skills/` |
| Qoder          | `.qoder/skills/`  |
| GitHub Copilot | `.github/skills/` |

## See also

- [`agent-layout`](../agent-layout/SKILL.md) — hybrid Cursor agent entries
- [`claude-code-layout`](../claude-code-layout/SKILL.md) — `.claude/` surfaces
- Agent families: [`../../agents/_shared/references/agent-families.md`](../../agents/_shared/references/agent-families.md)

## References

- [`references/checklist.md`](references/checklist.md) — new skill checklist
- [`assets/TEMPLATE-SKILL.md`](assets/TEMPLATE-SKILL.md) — starter SKILL.md
- Project compliance: `../../standards/agent-skills/references/16-agent-compliance.md`

## Examples

- Minimal: `agent-alignment-score/`
- Full (scripts + references): `provider-router/`
- Alias: `.qoder/skills/verify/` → `quality/`
