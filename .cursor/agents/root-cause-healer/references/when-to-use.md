# When to use root-cause-healer

## Wake

- User or upstream agent provides a **root cause hypothesis** (even tentative)
- Diagnosis is complete and the user wants the fix **deployed**, not just logged
- Post-incident loop: fix + prevent recurrence via rules/skills/hooks
- Server/runtime failure with a stated cause (e.g. corrupt dev cache, wrong import, RLS gap)
- User says: fix the cause, heal, deploy fix, close the loop, root cause fix

## Do not use

- No hypothesis and no symptoms — use `gap-analyst` first
- Pure UI/theme work — `frontend-implementer`
- Policy-only doc sync without a failure — `ai-docs-sync`
- Formal Alignment Score only — `agent-alignment-score` skill
- Adversarial review without implementation — `sceptic`

## Chains well with

| Phase              | Agent                                      |
| ------------------ | ------------------------------------------ |
| Pre-fix analysis   | `gap-analyst`, `spec-auditor`              |
| Implementation     | `patch-builder`, domain specialists        |
| Path/import safety | `import-auditor`                           |
| AI hardening       | `ai-docs-sync`, `skill-self-improve` skill |
| Done gate          | `sceptic`                                  |
