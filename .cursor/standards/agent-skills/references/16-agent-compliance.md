# 16 Agent Compliance (Arch Systems Extension)

Project subagents use **hybrid layout**: entry `.cursor/agents/<name>.md` (Cursor discovery) + collateral `.cursor/agents/<name>/` (`references/`, `scripts/`, `assets/`). Standard: `.cursor/standards/agent-layout/STANDARD.md`.

Agents **orchestrate**; skills (`.cursor/skills/`, `.qoder/skills/`, `.github/skills/`) **encode procedures**.

## Every agent MUST

1. Include **Gold Standard Contract** in entry body — see `.cursor/agents/_shared/references/gold-standard-contract.md`
2. Include **anti-triggers** in YAML `description`
3. End output with `Next owner: <agent|parent|skill> — <one line>`
4. **Delegate** to skills instead of duplicating procedural steps
5. Follow **runtime sequence** from `STANDARD.md`:
   - Match task → read skill `SKILL.md`
   - Execute `scripts/` when workflow says so
   - Load `references/` / `assets/` on demand
6. Keep procedural detail in collateral folder — entry file ≤65 lines

## Agent → skill routing

| Agent                  | Primary skills                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| fast-outliner          | `specs` (if spec needed)                                          |
| frontend-implementer   | `frontend-api-integration-patterns` (review)                      |
| ai-docs-sync           | `ai-system`, `skill-layout`, `agent-layout`, `claude-code-layout` |
| sceptic                | `agent-alignment-score` (formal score after estimate)             |
| idle-runner            | any safe read-only skill scripts                                  |
| ai-maintenance-checker | `pnpm ai fix` — unified layout/sync/dedupe                        |
| frontend-design        | — (visual brief; no skill duplication)                            |

## Background maintenance (every prompt)

Launch `ai-maintenance-checker` at prompt start; parent awaits before final reply on AI-surface work (`.cursor/rules/06-ai-maintenance-background.mdc`).

## Unified command

```bash
pnpm ai [init|onboard|status|check|fix]
```

## Parent agent (orchestrator)

Before claiming done on multi-file work:

1. `sceptic` → verdict + alignment estimate
2. `agent-alignment-score` → formal score block
3. `quality` or `verify` → gate evidence

## Authoring new agents / skills

- Agents: `agent-layout` meta-skill + `.cursor/standards/agent-layout/scripts/validate-agents.sh`
- Skills: `skill-layout` + [agentskills.io skill-creation guides](https://agentskills.io/skill-creation/best-practices)

```bash
pnpm ai check
```

## Never

- Embed full quality/RLS/spec procedures in agent files — use Qoder skills
- Fork Agent Skills standard in agent bodies — link to `.cursor/standards/agent-skills/`
- Emit formal Alignment Score from `sceptic` (estimate only)
