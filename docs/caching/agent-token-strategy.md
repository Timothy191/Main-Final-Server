# Agent Token-Strategy Guide

> **Provenance:** This document was originally claimed created by the Kiro row in `docs/REPO-CHANGE-INDEX.md` (2026-08-05) as a "comprehensive 13-section guide". Git history shows it was never committed. Restored on 2026-08-06 with content authored from the row's summary and verified repo state. Corrections are logged in the change index.

## 1. Why Context Is the Cost Driver

Measured fixed per-turn overhead in this monorepo (2026-08-06 audit):

| Source                               | Bytes  | Approx tokens |
| ------------------------------------ | ------ | ------------- |
| `AGENTS.md` (injected every message) | 23,581 | ~5.9K         |
| `CLAUDE.md` (injected every message) | 7,711  | ~1.9K         |
| `available_skills` (~214 entries)    | -      | ~8K           |
| System prompt                        | -      | ~3K           |
| **Total per turn**                   |        | **~19-22K**   |

The correct cost model is **messages x fixed overhead**, not calls x output. A session tail of ~42 tool-call messages costs ~850-950K input tokens, of which >90% is fixed overhead and ~1% is output. Every strategy below reduces either the fixed overhead or the message count.

## 2. File-Based Cache (STORE.md)

- `.agents/skills/agent-caching/STORE.md` is the cross-session live token store: project identity, package dependency order, critical file map, Redis/cache tokens, architecture invariants, department slugs, dev commands, knowledge gaps, ADRs, last known state.
- Protocol: **read-first, append-only new tokens, never regenerate what is already cached**.
- One write per session end; update Section 10 "last known state" by replacing the relevant row, not appending.

## 3. JIT Loading (Load on Demand)

- Do not eagerly read whole files into context. Read only the section you need using `offset`/`limit` on `view`.
- Prefer `lsp_definition` / `lsp_references` / `lsp_symbols` over `grep` + full-file reads (see section 7).
- Load path-scoped rules (`paths:` frontmatter in `.claude/rules/`) only when a file matches their scope; keep `gotchas` the only always-loaded rule.

## 4. Progressive Disclosure

- `CLAUDE.md` and `AGENTS.md` are indexes, not detail stores. Task-specific context lives in separate files (`docs/codebase-maps/`, `docs/design-system/`, `docs/architecture/`, `docs/runbooks/`).
- `CLAUDE.md` is capped at 300 lines by `check_context.sh` Check 1; `AGENTS.md` currently ~24KB. Growth belongs in linked docs, not these two files.
- Consult `docs/WAYFINDER.md` before touching a domain instead of loading all domain docs.

## 5. Shell Output Filtering

- Follow the output compaction protocol from `docs/context_efficiency.md`: `✓`/`✗` indicators for passes, full failure output only for critical errors (minimal stack trace + line number).
- The `run_silent.sh` wrapper referenced by `docs/context_efficiency.md` Rule 3 does not currently exist in the repo; the ✓/✗ convention is enforced by discipline, not by script.
- Do not echo entire tool outputs back into the transcript; summarize in one or two lines.

## 6. Delegation

- Use the `agent` tool for searches where the right file is uncertain (glob/grep/ls with a targeted prompt) instead of iterating guesses yourself.
- Long or mechanical verification passes (multi-file greps, byte counting, symlink inspection) are cheaper as delegated scans than as repeated full-context tool calls.

## 7. Symbol-Level Operations

- Prefer LSP tools over text tools: `lsp_definition`, `lsp_references`, `lsp_call_hierarchy`, `lsp_symbols`, `lsp_replace_symbol`, `lsp_rename`.
- Language-aware symbol ops skip comments/strings, avoid whitespace-matching failures, and return only the symbol's boundaries rather than whole files.

## 8. Batching

- Each message is the expensive unit (~19-22K fixed tokens). Batch independent tool calls into a single message (multi-call turns) instead of serializing them.
- Use `multiedit` for multiple edits to one file; run independent bash commands in parallel tool calls.

## 9. Compaction Protocol

- At every natural pause point, before compaction, and at handoff: update `.agents/skills/agent-caching/SESSION-CACHE.md`.
- The template carries: CURRENT SESSION (Agent/Date/Task/Status), FILES ALREADY READ, DECISIONS MADE, CURRENT TASK STATE, BLOCKERS, KEY FINDINGS, HANDOFF NOTES, PREVIOUS SESSIONS.
- Overwrite the CURRENT SESSION block each session; append the finished session to PREVIOUS SESSIONS. Check this file before asking the user what is in progress.

## 10. Static-Context Trim (available_skills)

- `available_skills` (~214 entries, ~8K tokens/turn) is the largest single fixed cost after the repo policy files.
- In this repo, `.claude/skills/` contains 382 symlinks to the global almanac (`~/.agents/skills/`), 0 broken, 0 native. The repo natively owns 7 skills in `.agents/skills/`.
- Recommended posture: inject repo-native skills eagerly; load global-almanac skills on demand by name. Trimming the global almanac itself is outside repo control and must not be mutated from this repo.
- Re-check with `find .claude/skills -type l | wc -l` and prune only symlinks this repo actually uses.

## 11. Per-Agent Bootstrap Table

| Agent       | Bootstrap file                                          | Role                                                        |
| ----------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| Claude Code | `CLAUDE.md` (root + `apps/portal/CLAUDE.md`)            | Onboarding, commands, architecture, conventions             |
| All agents  | `AGENTS.md`                                             | Canonical repo policy                                       |
| Cursor      | `.cursor/rules/*.mdc`                                   | Path-scoped rules with `globs`                              |
| Kiro        | `.agents/KIRO.md`                                       | Kiro-specific bootstrap, token-saving habits, anti-patterns |
| All agents  | `.agents/skills/agent-caching/{STORE,SESSION-CACHE}.md` | Cross-session + in-flight state                             |

## 12. Enforcement

- `./.scripts/check_context.sh`: 9 checks, including CLAUDE.md < 300 lines, no inline test-runner commands in CLAUDE.md (command-invocation pattern only, so `@swc/jest` passes), no unsafe agent state outside `.agents/{knowledge,skills,rules}/`, token integrity, ACL consistency. Must exit 0.
- `node tools/agents-verify.mjs`: AGENTS.md link/reference sync.
- `docs/REPO-CHANGE-INDEX.md`: append a row for every change before declaring done.
- `.agents/AGENT_TRACER.md`: entry per task (Agent, Timestamp, Purpose, Changes, Dependencies, Notes; optional `DRIFT SCORE:` line).

## 13. Measuring and Tuning

- Measure, do not estimate: `wc -c <file>` for injected files, `find .claude/skills -type l | wc -l` for skill count, message counts from the session transcript.
- The single highest-leverage lever is reducing **message count** (batching, section 8) and the second is reducing **fixed per-turn overhead** (sections 2-4, 10).
- Re-run this audit periodically: fixed overhead drifts as `AGENTS.md` and `CLAUDE.md` grow; `check_context.sh` Check 1 catches only the latter's line count.
