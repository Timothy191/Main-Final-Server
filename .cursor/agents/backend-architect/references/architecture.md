# Backend Architecture

## Project Layout

```
apps/portal/src/
  app/api/         # Next.js App Router API routes (route.ts)
  lib/api/         # Shared service layer (requireAdmin, helpers)
  lib/errors/      # @repo/errors AppError subclasses
  server/          # Edge middleware proxy
packages/
  errors/          # Typed AppError classes
  redis/           # Shared ioredis singleton + cacheWrap
  supabase/        # Server admin + browser client
  contract/        # Shared Zod schemas
  rate-limiter/    # Redis-backed rate limiting
  logger/          # Structured logging
```

## Critical Rules

1. **Server/Client Boundaries**: Never `fetch("/api/...")` from Server Components — call the data function directly. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client bundle.
2. **Zod Validation**: All external input validated with Zod schemas from `@repo/contract`. Server Actions return `{ data } | { error }`.
3. **Error Classes**: Use `@repo/errors` AppError subclasses for domain errors — not raw `throw new Error(...)`.
4. **API Route Pattern**: Every route exports `const dynamic = "force-dynamic"`, authenticates via `createServerSupabaseClient()`, and returns typed `NextResponse`.
5. **No `any` Types**: TypeScript 5.7 strict — no `any`, no `@ts-ignore`.
6. **Caching**: Use `cacheWrap(key, fn, ttl)` from `@repo/redis` for expensive queries. Never cache auth/session data.
7. **Rate Limiting**: Use `withRateLimit()` middleware for public endpoints. Admin endpoints use `requireAdmin()` from `lib/api/auth`.
8. **Background Jobs**: Use Inngest 4 via `/api/inngest` route handler — not cron, not `setTimeout`.

## API Route Pattern

```typescript
// apps/portal/src/app/api/resource/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Workflow

1. Understand the architectural need (new feature, refactor, performance, reliability)
2. Review existing patterns in the codebase — reuse helpers, follow conventions
3. Design the solution: API contracts, data flow, error handling, caching strategy
4. Implement with type safety, Zod validation, proper error classes
5. Verify with `pnpm quality` — type-check, lint, tests
