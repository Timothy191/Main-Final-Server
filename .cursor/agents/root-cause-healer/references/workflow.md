# Root Cause Healer Workflow

## 1. Ingest hypothesis

Capture in the report:

| Field          | Example                                                            |
| -------------- | ------------------------------------------------------------------ |
| Symptom        | `ENOENT` for `.next/dev/server/app-paths-manifest.json`            |
| Hypothesis     | Turbopack dev cache corrupt after theme edits                      |
| Evidence       | `next-development.log`, missing manifest under `.next/dev/server/` |
| Affected paths | `apps/portal/.next/dev/`, hub theme files                          |

If the hypothesis is missing, run `gap-analyst` first and return with findings.

## 2. Verify (mandatory)

```text
OBSERVE → read logs, manifests, git diff, process list
HYPOTHESIZE → restate cause in one sentence
VERIFY → command or probe that proves/falsifies
```

- **Confirmed** → proceed to fix
- **Falsified** → document actual cause; update hypothesis; re-verify once
- **Blocked** → stop; report blocker with evidence (no patch theater)

## 3. Fix (minimal permanent diff)

Priority order:

1. Root cause fix (not symptom silence)
2. Same-pattern sweep (grep for siblings)
3. Type-check + lint on touched packages

Delegate when appropriate:

| Scope                       | Delegate to                       |
| --------------------------- | --------------------------------- |
| Compiler/structural patches | `patch-builder`                   |
| API/service design          | `backend-architect`               |
| DB/RLS/migrations           | `db-optimizer` + `pnpm audit:rls` |
| Test gaps/flakes            | `test-engineer`                   |
| Auth/secrets exposure       | `security`                        |

Run scoped quality before handoff:

```bash
export PATH="/home/timothy/.npm-global/bin:$PATH"
pnpm --filter portal type-check   # or package scope matching diff
pnpm --filter portal lint
pnpm --filter portal test -- --testPathPatterns="<changed-area>"
```

## 4. Audit paths (after any import/path change)

Delegate `import-auditor` when the fix:

- Moves or renames files
- Changes `tsconfig` paths or package exports
- Adds/removes workspace packages
- Touches `@/` or `@repo/*` imports

## 5. AI surface review (prevent recurrence)

Delegate `ai-docs-sync` with a concrete brief:

- Should a **rule** encode the guardrail? (e.g. never leave stale `.next/dev` after manifest errors)
- Should a **skill** capture the verify/fix procedure?
- Should a **hook** block the failure mode?
- Should an **agent routing** row be added?

Only propose add-ons with evidence the gap is repeatable. Do not fork `AGENTS.md` policy.

Optional: if 3+ similar successes or repeatable gap → parent runs `skill-self-improve`.

## 6. Done gate

- Multi-file or production-facing → `sceptic`
- Portal UI touched → portal keepalive check per `.cursor/rules/05-portal-dev-keepalive.mdc`
- Parent emits Alignment Score when task is non-trivial
