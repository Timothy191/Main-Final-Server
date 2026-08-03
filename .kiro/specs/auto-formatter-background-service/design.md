# Design: Auto-Formatter Background Service

## Architecture Overview

The auto-formatter background service operates as a background subagent in the Agentic AI surface (`.cursor/agents/auto-formatter.md`), utilizing the execution script at `.cursor/agents/auto-formatter/scripts/run-format.sh`.

```
[Agent Task Cycle]
       │
       ▼
[Auto-Formatter Subagent] ──► [run-format.sh] ──► [pnpm format (Prettier)]
       │
       ▼
[pnpm format:check & pnpm quality] ──► Verified Quality Gate
```

## Files & Boundaries

- Entry Point: `.cursor/agents/auto-formatter.md`
- Execution Script: `.cursor/agents/auto-formatter/scripts/run-format.sh`
- Registry Index: `.cursor/agents/README.md`
- Shared Knowledge Base: `.agents/knowledge/patterns/auto-formatting-and-specs.md`

## Boundary Enforcement
- The script executes purely in the CLI tool harness and does not inject application code into `apps/portal` or `packages/`.
