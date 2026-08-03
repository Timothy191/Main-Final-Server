# Alias: verify-changes → quality (full)

| Skill | Mode | Path |
|---|---|---|
| **Canonical** | full / portal | `.qoder/skills/quality/` |
| `verify` | portal only | `.qoder/skills/verify/` |
| `verify-changes` | full (this skill) | `.github/skills/verify-changes/` |

`pnpm quality` is the single gate. This skill exists so GitHub Copilot / VS Code skill discovery still finds a familiar name.

Do **not** reimplement format→lint→tsc→test here — always call `quality/scripts/run-full.sh`.
