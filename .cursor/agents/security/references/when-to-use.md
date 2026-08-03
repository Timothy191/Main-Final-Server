# When to use security

## Wake

- Security audit, vulnerability review, or threat model requested
- New `/api/*` routes, auth flows, or Server Actions touching sensitive data
- Database migration or RLS policy change — run `pnpm audit:rls`
- User says: security, vuln, pen test, exploit, CSP, CORS, secrets leak
- Before production deploy when auth, exports, or admin surfaces changed

## Do not use

- General UI or visual design → `frontend-implementer` / `frontend-design`
- Docs/rules drift → `ai-docs-sync`
- Performance-only tuning → `db-optimizer`
- Formal Alignment Score emission → `agent-alignment-score` skill

## Commands

```bash
pnpm audit:rls          # after migrations
pnpm audit              # dependency vulnerabilities
grep -r "SUPABASE_SERVICE_ROLE" apps/portal/src/  # client leak check
```
