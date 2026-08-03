# When to use backend-architect

## Wake

- New API route design, service decomposition, or NestJS→Next migration
- Caching strategy, rate limiting, or background job (Inngest) architecture
- Error-handling patterns, `@repo/contract` schemas, or `@repo/errors` usage
- User says: API design, refactor backend, service layer, data architecture
- Multi-route feature needing consistent auth, validation, and response shape

## Do not use

- Portal UI components → `frontend-implementer`
- Branded hero / visual composition → `frontend-design`
- Raw SQL/index tuning → `db-optimizer`
- Security-only audit without design work → `security`

## Verify

```bash
pnpm --filter portal type-check
pnpm --filter portal lint
pnpm quality   # before claiming architecture done
```
