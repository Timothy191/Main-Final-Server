# Agent Layout Standard (Project Canonical)

**Cursor constraint:** Subagents must be **flat** `.cursor/agents/<name>.md` files — Cursor does not load nested `AGENT.md` folders. Collateral lives in a **sibling directory** with the same name.

## Hybrid layout (required)

```
.cursor/agents/
├── README.md
├── _shared/                    # cross-agent references
│   └── references/
├── <agent-name>.md               # ENTRY — YAML frontmatter + lean body (≤65 lines)
└── <agent-name>/                 # COLLATERAL (same basename as entry)
    ├── references/               # detailed docs — load on demand
    ├── scripts/                  # helper scripts (optional)
    └── assets/                   # output templates (optional)
```

## Entry file (`<agent-name>.md`) must include

1. YAML frontmatter: `name`, `description` (with anti-triggers), optional `model` / `readonly` / `is_background`
2. **Gold Standard Contract** (brief)
3. **Agent Skills Standard** pointer
4. **Mandate** (one line)
5. **Workflow** — numbered steps linking to `references/`
6. **Output** — link to `assets/` template

## Runtime (mirrors skills)

1. Cursor loads entry `.md` at session start
2. On invoke → read `<agent-name>/references/` as needed
3. Run `<agent-name>/scripts/` when workflow requires
4. Fill `<agent-name>/assets/` templates for output

## Related surfaces

| Surface        | Path                                    | Role                               |
| -------------- | --------------------------------------- | ---------------------------------- |
| Skills         | `.cursor/skills/`                       | Procedures (quality, score, specs) |
| Rules          | `.cursor/rules/`                        | Always-on policy                   |
| Hooks          | `.cursor/hooks.json` + `.cursor/hooks/` | Session/shell gates                |
| Kiro           | `.kiro/agents/default.json`             | Machine-readable gates             |
| Skill standard | `.cursor/standards/agent-skills/`       | Skill folder layout                |

## Validate

```bash
.cursor/standards/agent-layout/scripts/validate-agents.sh
# or full stack:
.cursor/standards/agent-skills/scripts/validate.sh
```

## Authoring

- Meta-skill: `.cursor/skills/agent-layout/`
- Template: `.cursor/skills/agent-layout/assets/TEMPLATE-AGENT.md`
