# Qoder Project Skills (`.qoder/skills/`)

Workflow skills for Qoder / slash commands. Mirror `AGENTS.md` — do not fork policy.

## Layout

```
skill-name/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

## Skills

| Skill                   | Purpose                     | Script                                 |
| ----------------------- | --------------------------- | -------------------------------------- |
| [quality](quality/)     | Full or portal quality gate (canonical) | `scripts/run-full.sh`, `run-portal.sh` |
| [verify](verify/)       | Portal alias → quality                  | `scripts/run-portal.sh`                |
| [specs](specs/)         | Spec-driven workflow        | `scripts/create-spec.sh`               |
| [dev](dev/)             | Dev server start/health     | `scripts/start.sh`                     |
| [deploy](deploy/)       | Deploy dev/local            | `scripts/deploy-dev.sh`                |
| [rls-audit](rls-audit/) | RLS migration audit         | `scripts/audit.sh`                     |

## Quick commands

```bash
.qoder/skills/quality/scripts/run-full.sh
.qoder/skills/specs/scripts/create-spec.sh "Feature Name"
.qoder/skills/rls-audit/scripts/audit.sh
```

Formal Alignment Score: `.cursor/skills/agent-alignment-score/`  
Cursor commands: `.cursor/commands/` (e.g. `/swarm`)  
Quality family (`quality` / `verify` / GitHub `verify-changes`): `.cursor/agents/_shared/references/agent-families.md`
