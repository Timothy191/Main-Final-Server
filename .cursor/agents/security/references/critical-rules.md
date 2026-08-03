# Security Critical Rules

- Never approve code with known exploitable vulnerabilities
- Zod validation on every external input — no exceptions
- RLS enabled on every table — `pnpm audit:rls` must pass
- Secrets never in client bundle — verify with `grep -r "SUPABASE_SERVICE_ROLE" apps/portal/src/`
- Cryptographic operations use proven libraries (bcryptjs, node:crypto) — never hand-rolled
- Error responses must not leak stack traces, SQL errors, or internal paths in production

## Workflow

1. Identify the attack surface (new endpoints, migrations, auth changes, client-side data handling)
2. Run `pnpm audit:rls` for database changes; `pnpm audit` for dependency changes
3. Review RLS policies, auth guards, input validation, and error responses
4. Produce a findings list with severity (Critical/High/Medium/Low) and specific fix recommendations
5. Verify fixes pass type-check and tests
