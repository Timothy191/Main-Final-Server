# Import Auditor Workflow

## 1. Scope

```bash
cd /home/timothy/Projects
git diff --name-only HEAD
git diff --name-only --cached
```

- If empty and user did not request full audit → scan last commit or stated paths
- Include **consumers** when a shared package export changes

## 2. Run automated audit

```bash
.cursor/agents/import-auditor/scripts/audit-imports.sh
```

Optional flags:

```bash
.cursor/agents/import-auditor/scripts/audit-imports.sh --scope portal
.cursor/agents/import-auditor/scripts/audit-imports.sh --full
```

## 3. Manual spot checks

From [`checklist.md`](checklist.md):

- Portal `@/` aliases match real files under `src/`
- Each `@repo/*` import resolves to an `exports` entry in the target `package.json`
- No new deep imports into `packages/*/src/` internals bypassing the public API
- Test files import the same paths production code uses (no duplicate wrong aliases)

## 4. Classify findings

Group by:

1. **Broken** — fails `tsc` or file missing
2. **Boundary** — violates apps↔packages rules
3. **Stale** — points at deleted/moved module
4. **Risky** — resolves today but fragile (deep import, extension mismatch)

## 5. Handoff

| Outcome              | Next owner                                        |
| -------------------- | ------------------------------------------------- |
| Broken/stale imports | `patch-builder` or parent implementer             |
| Clean audit          | `sceptic` / parent for done claim                 |
| Repeatable gap       | `skill-self-improve` or `ai-docs-sync` for a rule |
