# Requirements — cli-agents-auto-wake

## Intent

Wire OpenSpec, Aider, Goose, and omp as first-class Cursor specialists with headless wrappers and auto-routing, without replacing `AGENTS.md` policy with harness boilerplate.

## Acceptance criteria

1. Native `AGENTS.md` is canonical; harness is optional sidecar (`alwaysApply: false`).
2. Four agents exist under `.cursor/agents/{openspec,aider,goose,omp}` with hybrid collateral.
3. Headless scripts fail closed on missing `timeout`, use non-interactive flags, and do not auto-commit (aider) or allow omp `yolo`.
4. Routing table in `.cursor/rules/04-subagent-auto-routing.mdc` includes wake/anti-trigger rows for all four.
5. Inventories synced: AGENTS.md, Kiro `default.json`, CLAUDE.md, `.claude/agents` symlinks.
6. `openspec/` initialized with `--tools none`; Kiro remains multi-file gate.
7. `pnpm ai check` PASS with stack never-dos present.

## Non-goals

- Migrating `.kiro/specs/` into OpenSpec
- Vendoring Cursor self-hosted cloud worker infra
- Paid full LLM one-shots as CI requirement
