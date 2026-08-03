# Editable scope (ai-maintenance-checker)

May create, edit, remove **only** under:

- `.cursor/skills/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/standards/`
- `.cursor/hooks/`, `.cursor/hooks.json`
- `.claude/` (sync mirrors, rules — not policy forks)
- `.qoder/skills/`, `.github/skills/` (indexes + symlinks only)
- `scripts/ai.sh`

## Forbidden

- `apps/portal/` product code (unless user explicitly requests)
- `AGENTS.md` policy amendments (route to user + `ai-docs-sync`)
- Secrets, `.env*`, force-push, npm/yarn
