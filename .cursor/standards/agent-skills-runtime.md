# Agent Skills Runtime

This document describes how agent skills are loaded, matched, and executed in the Arch Systems environment.

## Runtime Sequence

1. **Session Start** — Tool loads all `*.md` files in skill folders; agent internalizes workflows
2. **Task Match** — User intent matches skill `description` → follow that skill's `SKILL.md`
3. **Execution** — Run `scripts/` as subprocesses; read `references/` and `assets/` at prescribed steps
4. **Never Duplicate** — Procedural steps live in skills; agents orchestrate and delegate

## Agent File Structure

Agents use a hybrid structure:
- Entry file: `.cursor/agents/<name>.md` (YAML frontmatter + lean body)
- Collateral folder: `.cursor/agents/<name>/` containing:
  - `references/` — detailed documentation loaded on demand
  - `scripts/` — optional subprocess helpers
  - `assets/` — templates, static outputs

## Skill Folder Structure

Skills follow this structure:
```
<skill-name>/
  SKILL.md          # YAML frontmatter: name, description (trigger terms)
  scripts/          # optional — subprocess helpers
  references/       # detailed docs — load on demand
  assets/           # templates, static outputs
```

## Validation

Run `pnpm ai check` to validate agent and skill surfaces.

## Related Standards

- Agent Layout: `.cursor/standards/agent-layout/STANDARD.md`
- Skill Layout: `.cursor/skills/skill-layout/STANDARD.md`
- Gold Contract: `.cursor/agents/_shared/references/gold-standard-contract.md`
- Routing Rules: `.cursor/rules/04-subagent-auto-routing.mdc`