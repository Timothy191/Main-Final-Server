---
name: verify-changes
description: >-
  Alias of Qoder quality skill (full monorepo gate). Use before PR or broad
  change validation. Anti-trigger: do not replace agent-alignment-score or
  sceptic; for portal-only use quality portal mode /verify.
---

# Verifying Changes (alias → quality / full)

Thin GitHub/Copilot alias of `.qoder/skills/quality` in **full** mode.

## Workflow

1. Run the wrapper (delegates to quality full):
   ```bash
   .github/skills/verify-changes/scripts/verify.sh
   ```
2. Prefer canonical skill docs: [`.qoder/skills/quality/SKILL.md`](../../../.qoder/skills/quality/SKILL.md)
3. Emit output per [`.qoder/skills/quality/references/gold-contract.md`](../../../.qoder/skills/quality/references/gold-contract.md)

## References

- [`references/alias.md`](references/alias.md) — relationship to `quality` / `verify`
- Family map: `.cursor/agents/_shared/references/agent-families.md`
