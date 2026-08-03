---
description: Security rules for the Arch Systems monorepo
globs: ["**/*.ts", "**/*.tsx"]
---

# Security Rules

## Server / Client Boundary

- Default to Server Components. Add `"use client"` only when required.
- Never import `@repo/supabase/server` or `@repo/redis` from a Client Component.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any non-`NEXT_PUBLIC_` secret to the client.
- All `"use client"` components must be leaf nodes or thin wrappers.
- Do not put `"use client"` on layout files.

## Secrets & Env Vars

- Never commit secrets. All secrets go in `.env.local` (gitignored).
- Never prefix a secret with `NEXT_PUBLIC_`.
- Server-only vars must be validated at startup (use `getEnv()` pattern in `@repo/supabase/server`).
- A guardrail hook blocks writes to `.env*` files that contain secret values.

## Input Validation

- Validate all external input (forms, URL params, request bodies) with Zod before use.
- Use parameterised Supabase queries — never string-interpolated SQL.
- Every Server Action and Route Handler must verify the session **before** reading inputs.
- Rate-limit public mutation endpoints using `@repo/rate-limiter` (backed by `@repo/redis`).

## Headers & CSP

- Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy) are set in `next.config.mjs`.
- CSP is enforced in production, report-only in development (configured in `next.config.mjs`).
- `poweredByHeader` is disabled.

## Error Handling

- Use `AppError` subclasses from `@repo/errors` — never raw `new Error()` for domain errors.
- Do not expose stack traces or internal error details to the client.
- Log with `[context]` prefixes using `console.error`/`console.warn` — never `console.log`.
