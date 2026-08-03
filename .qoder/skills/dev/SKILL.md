---
name: dev
description: >-
  Start the development server with Redis → Supabase → portal, stack smoke,
  monitoring terminals, and login browser. Use when portal is down or full
  stack is needed. Anti-trigger: do not use for deploy; do not replace portal
  keepalive curl check for quick UI verify.
---

# Start Dev Server

Boot order: **Redis → Supabase → host Next.js** on `:3000`, then stack smoke,
monitoring terminals, and browser to `/login`.

## Workflow

1. Check health: `scripts/check-health.sh`
2. If not running, start: `scripts/start.sh [flags]`
3. Stop when done: `scripts/shutdown.sh` (see [`references/modes.md`](references/modes.md))

## Scripts

| Script                    | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `scripts/check-health.sh` | Probe `:3000` health endpoint                |
| `scripts/start.sh`        | Run `scripts/dev.sh` from repo root          |
| `scripts/shutdown.sh`     | Stop portal; `--infra` also Redis + Supabase |

## References

- [`references/modes.md`](references/modes.md) — flags and shutdown
- Spec: `.kiro/specs/dev-boot-sequence/`
