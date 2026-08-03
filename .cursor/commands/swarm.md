---
name: swarm
description: Init, idle/status, or deploy a Claude Flow swarm — your text becomes the -o objective
---

# /swarm

Claude Flow swarm lifecycle for this repo. Parse `$ARGUMENTS` (everything after `/swarm`).

## Subcommands

| Args                                     | Action                                                    |
| ---------------------------------------- | --------------------------------------------------------- |
| _(empty)_ / `status` / `idle` / `health` | Show swarm status (idle check; `health` aliases `status`) |
| `init`                                   | Initialize hierarchical swarm                             |
| `stop` / `shutdown`                      | Stop swarm                                                |
| `deploy …` / `start …` / any other text  | **Deploy** — that text is the objective                   |

## Commands to run

Always prepend `PATH` with `~/.npm-global/bin` when needed. Run from repo root `/home/timothy/Projects`.

**Init**

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

**Idle / status**

```bash
npx @claude-flow/cli@latest swarm status
```

**Deploy** (required objective from user prompt)

```bash
npx @claude-flow/cli@latest swarm start -o "<OBJECTIVE>" -s development
```

**Stop**

```bash
npx @claude-flow/cli@latest swarm stop
```

## Objective extraction (critical)

When deploying:

1. Strip a leading `deploy` or `start` keyword if present.
2. The **remaining text** is `<OBJECTIVE>` — place it verbatim in `-o "…"`.
3. Escape shell quotes in the objective (prefer single-quoted `-o` with embedded `'` escaped, or pass via env).
4. If after stripping there is **no** objective text, ask once: `What should the swarm work on?` — do not invent an objective.

Examples:

- `/swarm deploy Fix login rate limiting` → `-o "Fix login rate limiting"`
- `/swarm start Analyze portal hub performance` → `-o "Analyze portal hub performance"`
- `/swarm Harden RLS on shift reports` → `-o "Harden RLS on shift reports"`
- `/swarm` → status only
- `/swarm init` → init only

## Workflow

1. **Init path** — run init; print Swarm ID / topology; stop unless also given a deploy objective in the same message.
2. **Idle path** — run status; summarize agents/tasks/progress; stop.
3. **Deploy path** —
   - If no swarm exists or status looks stale (long idle, errors), run **init** first, then **start**.
   - Run `swarm start -o "<OBJECTIVE>" -s development`.
   - Show status after start.
   - Spawn parallel workers via the Task tool with `run_in_background: true` for the objective’s concrete workstreams (respect `.cursor/rules/04-subagent-auto-routing.mdc`).
   - **Note:** CLI `swarm status` agent count often stays `0` — real workers are Cursor Task agents unless you also `agent spawn`. Do not treat 0 CLI agents alone as failure after a successful `start`.
4. Keep AGENTS.md policy; do not soft-fork stack rules.

## Response shape

Short table or bullets: Swarm ID, action taken, objective (if deploy), agent/task counts, next step.
