---
name: dev-tools-integration
description: >-
  Provides diagnostic instrumentation for Claude interactions using claude-devtools.
  MUST use when tracing performance, token bottlenecks, or unexpected model behavior.
---
  
## When to use
- Performance/latency debugging.
- Token usage optimization analysis.
- Investigating prompt-vs-output mapping issues.
- Debugging complex agentic loop failures (e.g., repeating incorrect patterns).

## Workflow
1. **Trace** — Use `claude-devtools` to trace the interaction.
2. **Analyze** — Identify bottlenecks in token usage or latency.
3. **Report** — Distill insights into `dev-tools-specialist/references/diagnostics.md`.
4. **Improve** — Trigger `skill-self-improve` if the diagnostic reveals a repeatable failure pattern.

## Scripts
- [`scripts/trace-interaction.sh`](scripts/trace-interaction.sh) (wraps `claude-devtools` diagnostics)

## Gold Standard Contract
Skill-self-improve: <skip>
Target: .cursor/skills/dev-tools-integration/
Next owner: parent — <one line>
