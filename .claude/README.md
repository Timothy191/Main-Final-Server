# Claude Code directory

This directory mirrors Cursor agentic surfaces for Claude Code.

## Files

| File | Role |
|------|------|
| `CLAUDE.md` | Thin wrapper pointing at root `CLAUDE.md` + `SOUL.md` |
| `settings.json` | Permissions and hook bindings (committed) |
| `rules/` | Path-scoped Claude rules (mirror `.cursor/rules/`) |
| `skills/` | Symlinks → `.cursor/skills/` |
| `agents/` | Symlinks → `.cursor/agents/*.md` |
| `scripts/sync-surfaces.sh` | Regenerate mirrors after AI-surface changes |

## Sync

```bash
.claude/scripts/sync-surfaces.sh
# or
pnpm ai fix
```

## Validate

```bash
.cursor/standards/claude-code/scripts/validate-claude-code.sh
```
