---
name: continual-learning
description: >-
  MUST use proactively after user sessions to update agent memory from transcripts.
  Extracts high-signal recurring user corrections and durable workspace facts.
  Anti-trigger: do not use for real-time decisions; do not store secrets or one-off details.
---

# Continual Learning

**Memory update skill.** Processes conversation transcripts to extract durable patterns and recurring corrections for AGENTS.md.

## When to use

- After user sessions with corrections or preferences
- When agents need to learn from past interactions
- Before major planning tasks to load contextual knowledge

## Anti-triggers

- Do **not** store secrets, API keys, or sensitive data
- Do **not** capture one-off transient details (single-use commands)
- Do **not** use for real-time decision making during active work
- Do **not** duplicate `ai-docs-sync` — this is for memory, not sync

## Workflow

1. Load index: [`scripts/load-index.sh`](scripts/load-index.sh) reads `continual-learning-index.json`
2. Scan transcripts: find files not in index or with newer mtime than indexed
3. Extract signals: [`scripts/extract-signals.sh`](scripts/extract-signals.sh) filters for:
   - Recurring user corrections (3+ similar patterns)
   - Durable workspace facts (paths, stacks, preferences)
   - Explicit user statements about workflows
4. Filter out: secrets, one-off commands, temporary workarounds
5. Delegate to `agents-memory-updater` subagent for AGENTS.md integration
6. Refresh index: update mtimes, remove deleted entries

## Scripts

| Script | Purpose |
|--------|---------|
| [`scripts/load-index.sh`](scripts/load-index.sh) | Load/create index file |
| [`scripts/extract-signals.sh`](scripts/extract-signals.sh) | Extract high-signal patterns |
| [`scripts/refresh-index.sh`](scripts/refresh-index.sh) | Update index mtimes |

```bash
.cursor/skills/continual-learning/scripts/extract-signals.sh ~/.local/share/devin/sessions/
```

## References

- [`references/signal-detection.md`](references/signal-detection.md) — what counts as high-signal
- [`references/index-format.md`](references/index-format.md) — index JSON schema
- [`references/privacy-rules.md`](references/privacy-rules.md) — what to exclude
- [Agent Skills Standard](../../standards/agent-skills/STANDARD.md)
