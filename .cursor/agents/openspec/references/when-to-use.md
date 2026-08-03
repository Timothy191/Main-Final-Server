# When to use openspec

## Wake

- Multi-file feature needing a change proposal
- `openspec validate` / `status` / `instructions` / `list` / `show` / `archive`
- User says OpenSpec, OPSX, change proposal, validate specs

## Do not use

- Portal UI paint / branded first viewport
- Pure lint or single-line fix
- Replacing `.kiro/specs/` silently — both may apply

## Headless flags

- Always: `--no-interactive` when available
- Prefer: `--json` for machine-readable validate/instructions
- Never: `openspec view` (interactive dashboard)
