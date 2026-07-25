# Parent lifecycle

1. **Prompt start** — parent launches `ai-maintenance-checker` in background (`is_background: true`)
2. **Parallel work** — parent continues primary task
3. **Before final reply** — parent awaits maintenance completion on AI-surface tasks; may skip await for pure portal UI with no AI file touches
4. **Handoff** — maintenance report → parent synthesizes; do not block on warnings-only

## Unified command

Prefer **`pnpm ai fix`** over scattered scripts:

```bash
pnpm ai init      # cold start
pnpm ai onboard   # checklist
pnpm ai status    # health (default)
pnpm ai check     # CI gate
pnpm ai fix       # repair + validate
```

Rule: `.cursor/rules/06-ai-maintenance-background.mdc`
