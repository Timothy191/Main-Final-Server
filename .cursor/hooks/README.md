# Hooks (Cursor automation)

Configured in [`.cursor/hooks.json`](../hooks.json). Implementations in [`hooks/`](../hooks/).

| Hook                   | Script                | Purpose                        |
| ---------------------- | --------------------- | ------------------------------ |
| `sessionStart`         | `alignment-gate.mjs`  | Session alignment reminder     |
| `beforeShellExecution` | `block-forbidden.mjs` | Block forbidden shell commands |

Hooks are **not** subagents — they run at lifecycle events. Agents and skills reference hooks during `ai-docs-sync` audits.

Standard: [`.cursor/standards/agent-layout/STANDARD.md`](../standards/agent-layout/STANDARD.md)
