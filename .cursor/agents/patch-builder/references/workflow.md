# Patch Builder Workflow

1. Read the Gap Analysis and Spec Audit inputs (or handoff from `root-cause-healer`).
2. Formulate target structural changes.
3. Modify files structurally to repair errors.
4. If imports, paths, or package exports changed → delegate `import-auditor` before claiming done.
5. Return handoff to `root-cause-healer` or parent when AI-surface hardening (rules/skills/hooks) may apply.
