# Dev Server Modes

## Start

```bash
# Full stack (default): Redis → Supabase → host portal
bash scripts/dev.sh

# Skip Redis/Supabase bring-up (infra already running)
bash scripts/dev.sh --no-infra

# Portal only — no Redis/Supabase start
bash scripts/dev.sh --quick

# Also run pnpm quality after stack smoke
bash scripts/dev.sh --quality

# Skip browser / monitoring terminals
bash scripts/dev.sh --no-browser --no-monitors
```

Portal-only alternative (keepalive rule):

```bash
cd apps/portal && PORT=3000 pnpm exec next dev --turbopack --hostname 0.0.0.0
```

## Shutdown

```bash
bash scripts/shutdown.sh          # Portal only
bash scripts/shutdown.sh --infra  # Portal + Supabase + Redis (compose profile infra)
```

## Runtime files

- PID: `.portal.pid` at repo root
- Logs: `portal.log` at repo root
- Default port: `3000` (`PORT=3001 bash scripts/dev.sh` to override)

## Related

- Studio: http://127.0.0.1:54323
- Auth: http://127.0.0.1:54321
- Redis: localhost:6379
- Monitoring: `scripts/open-monitoring-terminals.sh`
- Env check: `bash scripts/validate-env.sh --local`
