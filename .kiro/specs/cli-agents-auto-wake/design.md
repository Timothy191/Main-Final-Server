# Design — cli-agents-auto-wake

## Architecture

```
User task → 04-subagent-auto-routing → specialist agent
  → .cursor/agents/<name>/scripts/run-headless.sh → CLI
```

## Files

| Path                                                       | Role                                   |
| ---------------------------------------------------------- | -------------------------------------- |
| `.cursor/agents/{openspec,aider,goose,omp}.md`             | Entry + MUST auto-delegate description |
| `.cursor/agents/<name>/scripts/run-headless.sh`            | Headless wrapper                       |
| `.cursor/agents/_shared/references/external-cli-matrix.md` | Decision + security posture            |
| `.cursor/rules/04-subagent-auto-routing.mdc`               | Wake table                             |
| `openspec/`                                                | OpenSpec root (parallel to Kiro)       |

## Boundaries

- Scripts invoked from repo root (Claude symlinks resolve entry only).
- Goose: `GOOSE_MODE=auto` for headless; document high autonomy risk.
- omp: approval allowlist `write|always-ask`; block `yolo`.
- Aider: `--no-auto-commits` by default.

## Env

- `CLI_AGENT_TIMEOUT_SEC` (default 600)
- `GOOSE_MODE` (default auto in wrapper)
- `OMP_APPROVAL_MODE` (default write; yolo rejected)
- Model API keys remain in user env — never committed
