# Agent Skills Runtime (for all agents)

Canonical skill standard: [`.cursor/standards/agent-skills/STANDARD.md`](../../../standards/agent-skills/STANDARD.md)

## Sequence

1. Match user task to a **skill** `description` OR **agent** `description`
2. If skill → `SKILL.md` → `scripts/` → `references/` → `assets/`
3. If agent → entry `.md` → `<agent>/references/` → scripts/assets

## Agent → skill routing

| Agent                  | Delegate to skills                                                |
| ---------------------- | ----------------------------------------------------------------- |
| fast-outliner          | `specs` (multi-file)                                              |
| frontend-implementer   | `frontend-api-integration-patterns`, `quality`/`verify`           |
| ai-docs-sync           | `ai-system`, `skill-layout`, `agent-layout`, `claude-code-layout` |
| sceptic                | `agent-alignment-score` (after estimate)                          |
| idle-runner            | read-only skill scripts only                                      |
| ai-maintenance-checker | `pnpm ai` — layout/sync/dedupe                                    |
| frontend-design        | — (visual brief only)                                             |

## Unified validation

```bash
pnpm ai check
```

`sceptic` → `agent-alignment-score` → `quality`
