# Merge rules (no watered-down copies)

## Detect

Run `detect-duplicate-skills.sh` or `pnpm ai check`.

Flags:

- Same skill name in `.cursor/skills/` and `.qoder/skills/` with divergent `SKILL.md`
- Copy-paste of `agent-alignment-score` / `skill-layout` with trimmed steps
- Second skill that only rephrases an existing workflow

## Resolve (priority)

1. **Alias** — Qoder/GitHub skill `SKILL.md` links to `.cursor/skills/<name>/` canonical
2. **Merge** — combine unique references into canonical; delete duplicate folder
3. **Rename** — if genuinely different scope, rename + fix description triggers

## Never

- Leave two full copies with 80% overlap
- Soften never-dos in a "mirror" skill
- Fork `AGENTS.md` policy into a skill body
