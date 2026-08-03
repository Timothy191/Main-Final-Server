# AI System Standard (Unified Command)

Single entry: **`pnpm ai`** — replaces scattered validate/sync/inventory scripts.

## Modes

| Mode      | Purpose                                        |
| --------- | ---------------------------------------------- |
| `init`    | Cold start: restore standards, sync, validate  |
| `onboard` | Checklist for humans + agents joining the repo |
| `status`  | Read-only health report (default)              |
| `check`   | Validate only; exit 1 on failure               |
| `fix`     | Safe repair + check                            |

## Pipeline (by mode)

| Mode               | Phases                                                            |
| ------------------ | ----------------------------------------------------------------- |
| `init` / `fix`     | INVENTORY → RESTORE → SYNC → GUARDRAILS → LAYOUT → DEDUPE → DRIFT |
| `check` / `status` | INVENTORY (status only) → GUARDRAILS → LAYOUT → DEDUPE → DRIFT    |

## Gold enforcement

- SOUL.md + `01-real-world-logic.mdc` — evidence before claims
- `02-agent-scoring.mdc` — Alignment Score ≥80
- Hooks — session alignment + forbidden commands
- `ai-maintenance-checker` — background layout janitor every prompt

## Merged commands (do not run separately)

- `.cursor/standards/agent-skills/scripts/validate.sh`
- `.cursor/standards/agent-layout/scripts/validate-agents.sh`
- `.cursor/standards/claude-code/scripts/validate-claude-code.sh`
- `.claude/scripts/sync-surfaces.sh`
- `.cursor/agents/ai-docs-sync/scripts/inventory.sh`
- `.cursor/agents/ai-docs-sync/scripts/verify-mirrors.sh`
- `.cursor/agents/ai-maintenance-checker/scripts/run-maintenance.sh`
