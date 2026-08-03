# Arch Systems Repo Mapping

Use existing modules — do not redefine error types locally.

| Module                  | Pattern                              | Location                    |
| ----------------------- | ------------------------------------ | --------------------------- |
| `@repo/errors`          | `APIError`, `AuthError`, type guards | `packages/errors/`          |
| `@repo/supabase/client` | Browser Supabase client              | `packages/supabase/`        |
| Portal hooks            | Cancellation guards                  | `apps/portal/src/hooks/`    |
| Server Actions          | Zod + `{ data } \| { error }`        | `apps/portal/src/features/` |

```ts
// Correct
import { APIError } from "@repo/errors";

// Wrong — duplicates existing hierarchy
// export class ApiError extends Error { ... }
```

Server Components must call data functions directly — never `fetch("/api/...")` from RSC.
