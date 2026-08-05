# @repo/supabase — Specification

Universal Supabase client architecture providing cookie-backed server clients, middleware session refreshers, service-role admin clients, read-replica clients, and browser shims.

## 1. Overview & Architecture

`@repo/supabase` manages all database authentication, Row Level Security (RLS) contexts, and client instantiations for Next.js 16 App Router.

---

## 2. Exported Subpaths & Methods

### 2.1 Server Clients (`./server`)

- **`createServerSupabaseClient()`:** Cookie-backed server client for Server Actions and Server Components. Enforces RLS based on active user session.
- **`createAdminClient()`:** Service-role client bypassing RLS (`SUPABASE_SERVICE_ROLE_KEY`). Strictly server-only.
- **`getUserSafely(supabase)`:** Safely extracts the current authenticated user or returns `null`.
- **`instrumentedFetch`:** Custom fetch wrapper recording PostgREST query timing for telemetry.

### 2.2 Middleware (`./middleware`)

- **`createMiddlewareClient(request)`:** Binds Supabase auth cookie refresh logic to Next.js middleware `NextRequest` and `NextResponse`.

### 2.3 Read Replica (`./read-replica`)

- **`createReadReplicaClient(cookieList?)`:** Directs analytical and reporting queries to `NEXT_PUBLIC_SUPABASE_READ_REPLICA_URL`.

### 2.4 Browser Client (`./client` & `.`)

- **`createClient()` / `createBrowserSupabaseClient()`:** Browser-safe client instance.

---

## 3. Dependencies

- `dependencies`: `@supabase/ssr` (`^0.6.1`), `@supabase/supabase-js` (`^2.49.0`), `next` (`^16.0.0`)
