---
name: context-optimizer
description: >-
  Optimizes context window usage by indexing tool outputs in SQLite.
  MUST be used by memory-manager before context injection into agents.
---

name: context-optimizer
description: >-
  Optimizes context window usage by indexing tool outputs in SQLite.
  MUST be used by memory-manager before context injection into agents.
---
- Whenever task output exceeds 5,000 tokens.
- When agentic loops are suffering from "lost-in-the-middle" context degradation.
- Before injecting complex tool outputs into a parent orchestrator.

## Workflow
1. **Intercept** — capture tool output.
2. **Index** — pass to `scripts/optimize-context.sh` (SQLite-based filter).
3. **Inject** — return only distilled, relevant snippets to parent.

## Gold Standard Contract
Skill-self-improve: <skip>
Target: .cursor/skills/context-optimizer/
Next owner: parent — <one line>
