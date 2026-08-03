# Agent Skills Standard (Project Canonical)

**Source:** [agentskills.io](https://agentskills.io/home)

This directory is the **single canonical reference** for how skills and agents behave in Arch Systems. `AGENTS.md` points here; do not fork policy.

## Quick rules

| Layer                   | Standard                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **Skill folder**        | `skill-name/SKILL.md` + `scripts/` + `references/` + `assets/`                     |
| **Skill naming**        | kebab-case (`skill-creator`, `rls-audit`)                                          |
| **Agent file**          | Hybrid: `.cursor/agents/<name>.md` (entry) + `.cursor/agents/<name>/` (collateral) |
| **Install (this repo)** | `.cursor/skills/`, `.qoder/skills/`, `.github/skills/`                             |
| **Discovery**           | `npx skills find <query>` · `npx skills add <owner/repo>`                          |

## Runtime sequence (all agents must follow)

1. **Session start** — tool loads all `*.md` in skill folders; agent internalizes workflows
2. **Task match** — user intent matches skill `description` → follow that skill's `SKILL.md`
3. **Execution** — run `scripts/` as subprocesses; read `references/` and `assets/` at prescribed steps
4. **Never duplicate** — procedural steps live in skills; agents orchestrate and delegate

## Project extension

- [Agent compliance](references/16-agent-compliance.md) — project-specific agent→skill routing, done pipeline, authoring rules

## Validation

```bash
pnpm ai check
```

## Related project surfaces

- Meta-skill: `.cursor/skills/skill-layout/` · `.cursor/skills/agent-layout/`
- Agent layout: `.cursor/standards/agent-layout/STANDARD.md`
- Gold contract: `.cursor/agents/_shared/references/gold-standard-contract.md`
- Routing: `.cursor/rules/04-subagent-auto-routing.mdc`
- Full standard: https://agentskills.io/home
