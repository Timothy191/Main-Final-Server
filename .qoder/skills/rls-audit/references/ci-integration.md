# CI Integration

RLS audit runs in:

- `.github/workflows/quality-gate.yml` — `pnpm audit:rls`
- `.github/hooks/pre-commit.sh` — when migration files staged

Implementation: `tools/audit-rls.cjs` (via root `package.json` script).
