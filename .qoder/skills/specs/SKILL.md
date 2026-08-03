---
name: specs
description: >-
  Create and manage spec-driven workflow under .kiro/specs/. Use for multi-file
  features before implementation. Anti-trigger: do not skip phases for multi-file
  work; do not replace quality or alignment-score; do not implement without
  approved requirements/design.
---

# Spec-Driven Workflow

Mandatory for multi-file changes per `AGENTS.md`.

## Commands

| Intent          | Script                                  |
| --------------- | --------------------------------------- |
| Create new spec | `scripts/create-spec.sh <feature-name>` |
| List specs      | `scripts/list-specs.sh`                 |
| Task status     | `scripts/spec-status.sh <feature-slug>` |

## Workflow

1. **Create** — run create script; fill templates in order
2. **Requirements** — get user approval before design
3. **Design** — get user approval before tasks
4. **Tasks** — execute in order; mark done only after quality passes
5. **Quality** — use `quality` skill on completion

Full procedure: [`references/workflow.md`](references/workflow.md)

## Assets

Spec templates live in [`assets/templates/`](assets/templates/) (mirrors `.kiro/templates/`).

## References

- [`references/workflow.md`](references/workflow.md) — phased workflow and quality check
- [`references/commands.md`](references/commands.md) — slash-command mapping
