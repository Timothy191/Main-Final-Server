# dev.sh --quick Test Checklist & Coverage

**Date:** 2026-07-19  
**Purpose:** Verify that `dev.sh --quick` deploys the full stack correctly and passes all smoke tests

---

## Phase 0: Pre-flight

- [ ] Script starts without errors
- [ ] Checks for stale `.portal.pid` / `.portal.start` files and cleans them
- [ ] `PORT` variable defaults to `3000`
- [ ] `QUICK_MODE=true` skips Docker infrastructure checks

## Phase 1: Environment

- [ ] `.env.local` exists with required variables
- [ ] Supabase keys are set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] `REDIS_URL` is set (or Redis check is skipped in quick mode)

## Phase 2: Redis (skipped in --quick mode)

- [ ] Phase 2 shows as skipped/fast-check when `QUICK_MODE=true`

## Phase 3: Supabase

- [ ] Verifies Supabase connection (or reports known limitations)
- [ ] Does NOT start Docker containers (skipped in quick mode)

## Phase 4: Portal (Next.js)

- [ ] Portal starts on port 3000
- [ ] Portal ready in < 60 seconds (Turbopack HMR)
- [ ] `.portal.pid` file created
- [ ] `.portal.start` marker written
- [ ] Portal log at `portal.log` has no critical errors

### Route Smoke Tests

- [ ] `GET /login` → **200**
- [ ] `GET /hub` → **200**
- [ ] `GET /engineering` → **200**
- [ ] `GET /drilling` → **200**
- [ ] `GET /safety` → **200**

## Phase 5: Stack Smoke

- [ ] Portal responds to HTTP requests within 2 seconds
- [ ] Supabase RLS policies are active (no public access to protected tables)
- [ ] Redis is reachable (if configured) — `curl http://localhost:3000/api/health/cache`

## Watchdog Integration

- [ ] Watchdog script is executable: `scripts/portal-watchdog.sh`
- [ ] Watchdog restarts portal on crash (test by killing pid)
- [ ] Watchdog clears `.next` cache on restart

---

## Coverage Matrix

| Component         | Unit Tests                 | Integration | Smoke Test        |
| ----------------- | -------------------------- | ----------- | ----------------- |
| Portal boot       | N/A                        | N/A         | Phase 4           |
| Login route       | Portal test suite          | N/A         | Phase 5           |
| Hub route         | Portal test suite          | N/A         | Phase 5           |
| Department routes | Portal test suite          | N/A         | Phase 5           |
| Redis cache       | `@repo/redis` tests        | `pnpm test` | Phase 5           |
| Supabase client   | `@repo/supabase` tests     | `pnpm test` | Phase 3           |
| Rate limiter      | `@repo/rate-limiter` tests | N/A         | N/A               |
| Error handling    | `@repo/errors` tests       | N/A         | error.tsx UI test |

### Test commands

```bash
# Run all unit tests
pnpm test

# Run portal-specific tests
pnpm --filter portal test

# Run redis-specific tests
pnpm --filter @repo/redis test

# Type-check everything
pnpm type-check

# Full quality gate
pnpm quality
```

---

## Quick Verification Script

```bash
#!/bin/bash
# run after: bash scripts/dev.sh --quick --no-monitors --no-browser

echo "=== Route Smoke Tests ==="
for route in login hub engineering drilling safety; do
  status=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://localhost:3000/$route" 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo "  ✅ /$route → $status"
  else
    echo "  ❌ /$route → $status"
  fi
done

echo ""
echo "=== Portal Info ==="
echo "PID: $(cat .portal.pid 2>/dev/null || echo 'N/A')"
echo "Started: $(cat .portal.start 2>/dev/null || echo 'N/A')"
echo "Log size: $(wc -c < portal.log 2>/dev/null || echo 'N/A') bytes"
echo "Memory: $(ps -o rss= -p $(cat .portal.pid 2>/dev/null) 2>/dev/null | awk '{printf \"%d MB\", $1/1024}' || echo 'N/A')"
```
