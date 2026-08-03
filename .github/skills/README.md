# GitHub Agent Skills (`.github/skills/`)

Skills for GitHub Copilot and VS Code agent customization ([Agent Skills standard](https://agentskills.io/home)).

## Layout

Each skill folder contains:

- `SKILL.md` — YAML frontmatter (`name`, `description`) + workflow entry
- `scripts/` — helper scripts (optional)
- `references/` — detailed documentation (optional)
- `assets/` — templates and static resources (optional)

Scaffold new skills from [`TEMPLATE.md`](TEMPLATE.md).

## Skills in this repo

| Skill                                                                   | Purpose                                   |
| ----------------------------------------------------------------------- | ----------------------------------------- |
| [verify-changes](verify-changes/)                                       | Alias → Qoder `quality` (full gate)       |
| [frontend-api-integration-patterns](frontend-api-integration-patterns/) | Async fetch, cancellation, retry patterns |

## Related

- Cursor score skill: `.cursor/skills/agent-alignment-score/`
- Qoder workflows: `.qoder/skills/README.md`
- Cursor commands: `.cursor/commands/` (e.g. `/swarm`)
- Canonical policy: `AGENTS.md`
- Quality family: `.cursor/agents/_shared/references/agent-families.md`
