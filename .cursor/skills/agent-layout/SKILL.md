---
name: agent-layout
description: >-
  Meta-skill for creating or refactoring Cursor subagents to the hybrid agent
  layout standard. Use when adding agents, reorganizing .cursor/agents/, or
  auditing agent collateral folders. Anti-trigger: do not replace skill-layout
  for skills; do not implement product features.
---

# Agent Layout Standard

**Canonical:** [`.cursor/standards/agent-layout/STANDARD.md`](../../standards/agent-layout/STANDARD.md)

## Cursor constraint

Subagents **must** be flat `.cursor/agents/<name>.md` — Cursor does not load nested folders as agents.

## Hybrid layout

```
.cursor/agents/
├── <name>.md              # ENTRY (≤65 lines)
└── <name>/
    ├── references/
    ├── scripts/           # optional
    └── assets/            # output templates
```

## Entry file must have

- YAML: `name`, `description` (+ anti-triggers), optional `model` / `readonly` / `is_background`
- Links to `_shared/references/gold-standard-contract.md`
- Workflow steps pointing at `<name>/references/`
- Output template in `<name>/assets/`

## Validate

```bash
.cursor/standards/agent-layout/scripts/validate-agents.sh
```

## Authoring

- Template: [`assets/TEMPLATE-AGENT.md`](assets/TEMPLATE-AGENT.md)
- Checklist: [`references/checklist.md`](references/checklist.md) — inventories must sync in the same change
- CLI wrappers: [`references/cli-headless-wrappers.md`](references/cli-headless-wrappers.md)
- Skills counterpart: `.cursor/skills/skill-layout/`

## See also

- [`skill-layout`](../skill-layout/SKILL.md) — skill folder standard
- [`claude-code-layout`](../claude-code-layout/SKILL.md) — `.claude/` sync/validate
- Agent families: [`../../agents/_shared/references/agent-families.md`](../../agents/_shared/references/agent-families.md)

## Related surfaces

| Surface | Path                                    |
| ------- | --------------------------------------- |
| Agents  | `.cursor/agents/`                       |
| Skills  | `.cursor/skills/`                       |
| Rules   | `.cursor/rules/`                        |
| Hooks   | `.cursor/hooks.json` + `.cursor/hooks/` |
| Kiro    | `.kiro/agents/default.json`             |
