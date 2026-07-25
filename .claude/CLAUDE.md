# Claude Code mirror for Arch Systems

Policy source: root `CLAUDE.md` and `AGENTS.md`. This file is a thin wrapper.

## What to do

1. Load `CLAUDE.md` and `SOUL.md` at session start.
2. Follow `AGENTS.md` §1–§19 as canonical policy.
3. Use `.cursor/rules/` for always-on Cursor gates; mirror equivalent behavior in Claude Code.
4. Delegate to `.cursor/agents/` specialists when tasks match their descriptions.
5. End non-trivial work with `sceptic` review and `agent-alignment-score` formal scoring.
6. Before claiming done: `pnpm quality` for product code, `pnpm ai check` for AI-surface changes.

## Mirror layout

- `.claude/rules/` — optional path-scoped rules that shadow `.cursor/rules/`
- `.claude/skills/` — symlinks to `.cursor/skills/`
- `.claude/agents/` — symlinks to `.cursor/agents/*.md`
- `.claude/scripts/sync-surfaces.sh` — regenerates symlinks after AI surface changes

## Next owner

Next owner: `ai-maintenance-checker` — sync and validate mirrors.
