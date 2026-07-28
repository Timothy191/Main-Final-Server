# Migration Guide

This guide covers migration paths for existing users and contributors joining the Arch Systems Portal.

## New Users (First-Time Setup)

1. Clone the repo and install dependencies (`pnpm install`)
2. Start the dev stack (`pnpm dev`)
3. Access the portal at `http://localhost:3000`
4. Run `pnpm ai init` to set up AI surfaces
5. Run `pnpm quality` to verify everything works

## Migrating from Older Versions

### Version 1.x → 1.5.x

- **Node.js**: Ensure Node >= 22 (Volta pins 24.15.0)
- **pnpm**: Must be pnpm 9 (pinned via Volta)
- **Supabase**: Local dev requires Docker; Supabase runs on port 54321
- **Redis**: Must be running on port 6379 (or use the in-process `@repo/redis` native cache)

### Configuration Changes

- Environment variables are validated via Zod schema in `apps/portal/src/lib/env.ts`
- `.env.local` is required for portal development
- Supabase credentials must be set in environment or `.env.local`

## Known Issues

### @repo/redis Build Error

The `@repo/redis` package has a pre-existing build error:
```
Cannot find module '/packages/redis/src/stats' imported from packages/redis/src/cache.ts
```

This is caused by a missing `stats` module reference. The package builds successfully for the `@repo/redis` subpackage but fails when the portal tries to bundle it. Workaround: use `pnpm dev --quick` to skip the full build.

### Duplicate Skills

The `openspec-*` skills are duplicated across `.cursor/skills/`, `.qoder/skills/`, and `.github/skills/`. This is a known issue tracked for resolution. See `merge-rules.md` for the merge/alias strategy.

### Failing Tests

As of the current version, 10 tests across 5 suites are failing. These are pre-existing failures in:
- `export/fuel-logs` route tests
- `next-cache-handler` tests (Redis-dependent)
- `automated-audit` Inngest job tests
- `audit-aggregator` tests
- `ServicesDropdown` component tests

## Multi-Device Workflow

To work between your HP Zbook and work-remote-server:

```bash
# Start of session
git checkout main && git pull origin main && pnpm install

# End of session
git add . && git commit -m "feat: your message" && git push origin main
```

## Getting Help

- Check `.agents/knowledge/` for patterns and decisions
- Check `.cursor/rules/` for agent policies
- Run `pnpm ai status` for a full health report
- Run `pnpm ai fix` to auto-repair issues