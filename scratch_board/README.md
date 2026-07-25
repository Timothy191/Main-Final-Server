# scratch_board/ — live coordination surface for concurrent agents

Shared drop zone for **currently-in-flight** agent work. Every agent
that mutates the repo — writes files, runs migrations, starts a dev
server, dispatches a swarm — MUST post a check-in file here before
its first mutation and MUST remove it (or update it to
`status: done`) when it finishes. Other agents scan this directory
before starting so they can detect conflicts before they happen.

Not a durable log. Not a report archive. Reports live in
`.agents/reports/`; durable learnings live in `.agents/knowledge/`.
This directory is presence signalling only.

## Filename convention

```
<agent-slug>-<session-id>-<yyyymmdd-hhmm>.md
```

- `<agent-slug>` — the agent's `name` from its frontmatter
  (`swarm-coordinator`, `anti-drift`, `compression-agent`, …). For
  user-initiated work by the top-level Qoder agent, use `qoder`.
- `<session-id>` — 4-6 hex chars, unique per invocation. Reuse the
  Qoder session id if available; otherwise `openssl rand -hex 3`.
- `<yyyymmdd-hhmm>` — local start time.

Example: `swarm-coordinator-a1b2c3-20260725-1420.md`

## Required fields (frontmatter + body)

```markdown
---
agent: <slug>
session: <hex>
started: <ISO-8601 local>
expected_duration_min: <integer>
status: active | paused | done | failed
owner_scope:
  - <path or glob this agent is mutating>
must_not_touch:
  - <path or glob this agent will NOT touch>
depends_on: [] # session ids of other active check-ins this one waits on
---

# <agent> — <one-line mission>

## Files being written / edited

- `<path>` — <verb: create | edit | delete>

## Files being read (read-only)

- `<path>`

## Commands run

- `<one-line command>` — <intent>

## Notes

<free-form; keep tight>
```

## Read-before-write protocol

Before any mutating action, an agent MUST:

1. `ls scratch_board/*.md` — enumerate active check-ins.
2. For each file with `status: active`, read the `owner_scope` and
   `must_not_touch` lists.
3. **Conflict check.** If this agent's planned writes overlap another
   active agent's `owner_scope`, do one of:
   - **Wait** — record `depends_on: [<their-session>]` and retry when
     their check-in is `done` or removed.
   - **Escalate** — hand back to the user with the conflicting paths.
   - **Split** — narrow this agent's scope so it no longer overlaps.
     Never proceed into a known conflict. That is a hard fail.
4. Write this agent's own check-in file with `status: active` before
   the first mutation.

## Update rules

- Update the check-in when scope changes (new file, new command).
- Do not rewrite another agent's check-in — read only, unless
  releasing a clearly stale one (see Cleanup).
- On completion set `status: done` and either leave the file for the
  15-minute retention window or delete it.
- On failure set `status: failed`, add a `## Failure` section with
  the terminal error, and hand off.

## Cleanup

- `status: done` files older than 15 minutes may be removed by any
  agent — they are stale presence signals.
- `status: active` files older than the check-in's
  `expected_duration_min * 3` are considered abandoned. Any agent may
  set `status: failed` with reason `abandoned (no heartbeat)` and
  proceed — but only after `ls -la` confirms no live process holds a
  matching lock file and no recent commit touches the owner_scope.
- Never git-add a check-in file. This directory is gitignored except
  for `README.md` and `ACTIVE_TEMPLATE.md`.

## What NOT to put here

- Reports of completed work → `.agents/reports/`
- Durable patterns / decisions → `.agents/knowledge/`
- Configuration → `.qoder/rules/` or `.qoder/agents/`
- Secrets, credentials, PII → nowhere in this repo

## Sources

Pattern grounded in Aakash Gupta's _Parallel Claude Code Agents_ safe
workflow (centralised markdown coordination doc with Owner / Files /
Status / Owns / Must not edit) and CoAgent's file-based concurrency
control primitives.

- <https://www.aakashx.com/blog/parallel-claude-code-agents/>
- <https://arxiv.org/html/2606.15376v1>
- <https://code.visualstudio.com/blogs/2026/02/05/multi-agent-development>

See also: [`ACTIVE_TEMPLATE.md`](ACTIVE_TEMPLATE.md),
[`.qoder/rules/scratch-board.md`](../.qoder/rules/scratch-board.md).
