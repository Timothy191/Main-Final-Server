# Security Focus Areas

## OWASP Top 10 for Next.js + Supabase

- **A01 Broken Access Control**: RLS policies, Server Action authorization, middleware guards, IDOR prevention
- **A03 Injection**: Zod validation on all external input, parameterized Supabase queries, no raw SQL from user input
- **A07 Auth Failures**: Supabase auth flow security, session management, CSRF protection, rate limiting on auth endpoints
- **A08 Integrity Failures**: Dependency scanning (`pnpm audit`), supply chain security, build-time integrity

## Project-Specific Security

- **RLS Audit**: Run `pnpm audit:rls` after any migration — verify all tables have RLS enabled and policies are correct
- **Secrets**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client bundle; never prefix secrets with `NEXT_PUBLIC_`
- **API Routes**: All `/api/*` routes must validate input with Zod, authenticate via Supabase server client, and return `{ data } | { error }`
- **CSP**: Verify Content-Security-Policy headers are enforced (not just report-only) in production
- **CSRF**: Login endpoint validates Origin/Referer headers in production

## Threat Modeling Template

```markdown
# Threat Model: [Feature Name]

## Trust Boundaries

1. Browser → Next.js middleware (untrusted → semi-trusted)
2. Middleware → Server Components (semi-trusted → trusted)
3. Server → Supabase (trusted → restricted)
4. Supabase → PostgreSQL (trusted → data layer)

## STRIDE Analysis

| Threat   | Component | Risk    | Mitigation |
| -------- | --------- | ------- | ---------- |
| [threat] | [where]   | [level] | [fix]      |

## Security Requirements

- [ ] [specific, testable requirement]
```
