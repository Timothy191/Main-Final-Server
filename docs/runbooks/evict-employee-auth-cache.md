# Runbook: Evict a Stale Employee-Auth Cache Entry After a Role or Department Change

**Owner:** Platform / admin-on-call | **Frequency:** As Needed (after every role or department-access change)
**Last Updated:** 2026-08-03 | **Last Run:** —

## Purpose

The edge proxy (`apps/portal/src/proxy.ts` → `resolveEmployee`) resolves the
signed-in user's role and department access from the `employees` table **once**,
then caches the result at `arch:auth:employee:<userId>` for **300s** (Redis L2)
with a **30s** in-process L1 copy. For up to 5 minutes after a role or
department change, the proxy can keep authorizing the user on the **old** role —
letting them reach a now-forbidden route, or blocking a now-permitted one.

This runbook forces the proxy to re-read `employees` on the user's next request.
Use it **immediately after** any change to a user's row in `employees` (role
promotion/demotion, department access grant/revoke) when you cannot wait up to
5 minutes for the cache to expire on its own.

> **Automatic path (preferred).** Since ADR-001 landed, the admin role-change
> flow in `features/admin/tabs/UsersTab.tsx` calls
> `POST /api/cache/invalidate { userId }` automatically after a successful
> `employees` update, and that endpoint now evicts **both L1 and L2** via
> `cacheDelete` (`memoryDelete` + `redis.del`). So in normal operation **no
> manual step is required** — the next request re-reads `employees` on every
> pod. Use the manual steps below only when the automatic path failed or was
> bypassed (e.g. a direct DB edit, a Supabase trigger, or the eviction fetch
> errored).

## Prerequisites

- [ ] Admin access to the portal (an authenticated session cookie — the
      invalidation endpoint requires `supabase.auth.getUser()` to pass).
- [ ] The **target user's** Supabase auth `id` (not your own — evicting your
      own cache does not help the affected user). Get it from Supabase Studio →
      Authentication → Users, or:
- [ ] For the fallback path only: shell access to the production host and
      `$REDIS_PASSWORD` (set in `.env.production`, consumed by
      `docker-compose.production.yml`).

## Procedure

### Step 1: Identify the target user's auth id

```bash
# From the Supabase Studio SQL editor (on-prem Docker stack), or psql into the
# Postgres container:
SELECT id, email, created_at FROM auth.users WHERE email = 'name@company.com';
```

**Expected result:** one row; copy the `id` (a UUID). This is `<userId>` below.
**If it fails:** no row → the user has no auth account yet; create it first.
Multiple rows → disambiguate by `created_at` or full email match.

### Step 2: Evict the in-process L1 via the invalidation endpoint

From a shell that has an **admin** session cookie for the portal (or from the
browser devtools "Copy as cURL" of any authenticated portal request):

```bash
curl -s -X POST https://<portal-host>/api/cache/invalidate \
  -H 'Content-Type: application/json' \
  -H 'Cookie: <your-admin-session-cookie>' \
  -d '{"userId":"<userId>"}' | jq
```

**Expected result:**

```json
{
  "success": true,
  "invalidated": 0,
  "successCount": 0,
  "failedCount": 0,
  "tags": [],
  "evictedUserAuth": "<userId>"
}
```

The presence of `"evictedUserAuth": "<userId>"` confirms the L1 eviction ran.
(`invalidated`/`tags` are for the Next.js tag path and are unrelated to the
user-auth eviction.)

**If it fails:**

- `401 Unauthorized` → your session cookie is missing or expired; re-authenticate
  as an admin and retry.
- `400 No invalidation target specified` → the body was malformed; confirm the
  JSON is `{"userId":"<uuid>"}` and the `Content-Type` header is set.

### Step 3: (Fallback) Manually delete the Redis L2 key

> Since ADR-001, Step 2 already deletes the L2 key via `cacheDelete`, so this
> step is normally **not needed**. Use it only as a fallback when Step 2 ran but
> the user still sees the stale role (e.g. the `redis.del` inside `cacheDelete`
> silently failed, or the change was made directly in the DB bypassing the
> portal).

```bash
docker exec arch-redis-prod redis-cli -A "$REDIS_PASSWORD" DEL "arch:auth:employee:<userId>"
```

**Expected result:** `(integer) 1` (one key deleted). `(integer) 0` means the key
had already expired (300s TTL lapsed) — the cache is already fresh, nothing to do.

**If it fails:**

- `NOAUTH` / `WRONGPASS` → `$REDIS_PASSWORD` is unset or wrong; source
  `.env.production` first (`set -a; . ./.env.production; set +a`).
- `Could not connect` / container name not found → confirm Redis is running:
  `docker compose -f docker-compose.production.yml ps redis`. If it is down,
  follow [`redis-connection-down.md`](./redis-connection-down.md) first — the L2
  is already effectively evicted (a Redis outage forces `cacheGet` to miss and
  re-read `employees`), so the role change is already live once Redis recovers.

## Verification

- [ ] Ask the affected user to **fully log out and back in**, then navigate to a
      route gated by the **new** role/department. They should be permitted (or
      denied) per the change, not per the old role.
- [ ] From the portal host, confirm the key is gone:
      `docker exec arch-redis-prod redis-cli -A "$REDIS_PASSWORD" EXISTS "arch:auth:employee:<userId>"`
      → `(integer) 0`.
- [ ] Check `/api/health/cache` for a nominal cache layer (no error spike from
      the eviction): `curl -s https://<portal-host>/api/health/cache | jq`.

## Troubleshooting

| Symptom                                    | Likely cause                                                                                       | Fix                                                                                                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User still sees old role after Step 2      | The `redis.del` inside `cacheDelete` silently failed (Redis blip), or a pod's 30s L1 copy is stale | Run Step 3 (`redis-cli DEL`), or wait ≤30s for that pod's L1 to expire, or restart the portal pods (`docker compose -f docker-compose.production.yml restart portal`) |
| User still sees old role after Steps 2 + 3 | A pod's L1 still holds the 30s copy and was not the pod that handled the POST                      | Wait ≤30s for that pod's L1 to expire, or restart the portal pods (`docker compose -f docker-compose.production.yml restart portal`)                                  |
| `evictedUserAuth` absent from the response | `userId` was missing/falsy in the request body                                                     | Re-send with `{"userId":"<uuid>"}`                                                                                                                                    |
| 401 on the endpoint                        | No authenticated session on the request                                                            | Re-authenticate as admin; the endpoint enforces `auth.getUser()`                                                                                                      |
| Evicted the wrong user                     | Used your own id or mistyped the UUID                                                              | Re-run Steps 2–3 with the correct `<userId>`; no harm done (the wrongly-evicted user just re-reads `employees` on next request)                                       |

## Rollback

Eviction is idempotent and non-destructive — it only forces a cache miss. If you
evicted the wrong user, simply stop; their next request re-populates the cache
from `employees`. If the `employees` row itself was the mistake, correct the row
first, then re-run Steps 2–3 so the corrected role is picked up immediately.

## Escalation

| Situation                                                       | Contact              | Method                                 |
| --------------------------------------------------------------- | -------------------- | -------------------------------------- |
| Eviction runs but stale role persists >5 min across all pods    | Platform on-call     | PagerDuty (see `ops/alertmanager/`)    |
| `employees` row cannot be corrected (DB lock / Supabase outage) | DBA / Supabase admin | on-call channel                        |
| This runbook's commands do not match the running stack          | Doc owner            | open an issue against `docs/runbooks/` |

## History

| Date       | Run by           | Notes                                                                                                                                                    |
| ---------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-03 | Claude (glm-5.2) | Authored runbook; documented the L1-only `cacheEvictL1ByPrefix` gap (L2 300s TTL not cleared by the endpoint) as a known limitation pending a route fix. |
