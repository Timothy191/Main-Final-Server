# Audit pipeline

```
INVENTORY → AUDIT → PLAN → SYNC → VERIFY
```

## Inventory

Run `scripts/inventory.sh`

## Audit dimensions

- Drift (softened never-dos, alternate stacks)
- Stale facts (versions, paths, commands)
- Gaps (missing index entries)
- Duplicates (Cursor vs Qoder vs Kiro)
- Orphans (broken script/reference links)
- Agent layout (`validate-agents.sh`)
- Skill layout (`validate.sh`)

## Severity

- **critical** — contradicts §18 or security gates
- **warn** — stale/incomplete mirror
- **info** — missing cross-link

## Verify

```bash
pnpm ai check
```

Do not change `AGENTS.md` policy unless user explicitly requests amendment.
