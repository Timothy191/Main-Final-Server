# Source of truth

| Priority | Path                                                           | Role             |
| -------- | -------------------------------------------------------------- | ---------------- |
| 1        | `AGENTS.md`                                                    | Canonical policy |
| 2        | `.cursor/rules/`, `.qoder/rules/`, `.kiro/agents/default.json` | Mirrors          |
| 3        | `.cursor/skills/`, `.qoder/skills/`, `.cursor/agents/`         | Workflows        |
| 3        | `.cursor/hooks.json`                                           | Automation       |
| 4        | `CLAUDE.md`, `.kiro/README.md`, `docs/**`                      | Human docs       |

AGENTS.md wins on conflict. Do not soften §18 never-dos.
