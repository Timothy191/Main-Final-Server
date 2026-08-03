---
name: rls-audit
description: >-
  Verify Row Level Security coverage after database migration changes.
  Use after modifying packages/database/migrations/. Anti-trigger: do not
  replace migration authoring; do not claim schema safe without audit pass.
---

# RLS Audit

Every `CREATE TABLE` migration must include `ENABLE ROW LEVEL SECURITY`.

## Workflow

1. Run `scripts/audit.sh` (wraps `pnpm audit:rls`)
2. On failure, fix per [`references/fixing-violations.md`](references/fixing-violations.md)
3. Re-run until pass

## When to use

- After creating or editing `packages/database/migrations/*.sql`
- Before committing schema changes
- Pre-deploy when migrations changed

## Scripts

```bash
.qoder/skills/rls-audit/scripts/audit.sh
```

## References

- [`references/fixing-violations.md`](references/fixing-violations.md) — SQL fix patterns
- [`references/ci-integration.md`](references/ci-integration.md) — where audit runs in CI
