# Slash-command mapping

| User says               | Action                                   |
| ----------------------- | ---------------------------------------- |
| `/specs create <name>`  | `scripts/create-spec.sh <name>`          |
| `/specs list`           | `scripts/list-specs.sh`                  |
| `/specs status <slug>`  | `scripts/spec-status.sh <slug>`          |
| `/specs quality <slug>` | Run `pnpm quality`; report; update tasks |
