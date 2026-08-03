# Claude Code Standard (Project Canonical)

Native Anthropic Claude Code surfaces under `.claude/`. Policy source: `AGENTS.md` — never fork.

## Layout

```
.claude/
├── CLAUDE.md           # @imports root CLAUDE.md + SOUL.md
├── settings.json       # permissions + hooks (committed)
├── rules/              # modular path-scoped rules
├── skills/             # symlinks → .cursor/skills/
├── agents/             # symlinks → .cursor/agents/*.md
└── scripts/sync-surfaces.sh
```

## Validate

```bash
.cursor/standards/claude-code/scripts/validate-claude-code.sh
```

## Sync after changes

```bash
.claude/scripts/sync-surfaces.sh
# or: pnpm ai fix
```
