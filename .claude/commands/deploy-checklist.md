---
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*), Read, Glob, Grep
description: Generate an Arch-System pre-deployment readiness checklist (on-prem Supabase Docker stack, pnpm monorepo, the cold-cache quality gates, RLS, migrations, rollback triggers)
---

## Arguments

- `$ARGUMENTS`: optional service/release name or PR/commit range being shipped

## Your task

Produce a pre-deployment readiness checklist tailored to **Arch-System's actual
deploy surface** — an on-premise / local self-hosted Supabase Docker stack, a
pnpm/Turbo monorepo (Next.js 16 portal + `@repo/*` packages), and the project's
mandatory quality gates. Do not emit a generic checklist; every item should map
to a real command, file, or gate in this repo.

### Step 1: Gather the release context

- `git log --oneline -20` and `git diff --stat <base>..HEAD` to identify what is
  shipping (or use the PR/commit range in `$ARGUMENTS`).
- `git status` to confirm the working tree is clean (no uncommitted WIP that
  would silently ride along).
- Note whether the change includes: a Supabase migration
  (`packages/supabase/migrations/`), an RLS policy, an env var, a
  `turbo.json`/`globalEnv` change, a design-system token/class change, or an
  `@repo/acl` / `@repo/errors` contract change — each adds a dedicated check
  below.

### Step 2: Emit the checklist

```markdown
## Deploy Checklist: [service/release]
**Date:** [Date] | **Deployer:** [name] | **Base:** [base ref] → **Head:** [sha]

### Pre-Deploy — quality gates (MUST be cold-cache, see CLAUDE.md gotcha)
- [ ] `pnpm exec turbo run lint type-check test --force` → all pass, **0 cached**
      (a non-forced `pnpm quality` can return a stale PASS — do not trust it)
- [ ] `pnpm format:check` → clean
- [ ] `pnpm gates` → agents:verify + design:ratchet + theme:shape all pass
- [ ] `pnpm --filter portal build` → green

### Pre-Deploy — change-specific (only the boxes that apply)
- [ ] **Migration**: new file in `packages/supabase/migrations/` applied against a
      local stack (`pnpm supabase:start`) and verified in Studio; migration is
      reversible (down/rollback SQL known)
- [ ] **RLS**: if a table or policy changed, `pnpm audit:rls` run and policies
      tested in local Studio (RLS is enforced — never ship an untested policy)
- [ ] **Env var**: added to `turbo.json` `globalEnv` (or cache won't bust) and to
      `.env.production` / `.env.example` templates
- [ ] **Design system**: token/class/visual-contract change → `docs/design-system/
      SPEC.md` updated in the same change; structural change → ADR in
      `packages/theme/DECISIONS.md` + `docs/design-system/DESIGN.md` updated;
      `pnpm design:ratchet` and `pnpm theme:shape` still pass
- [ ] **Contract**: `@repo/acl` / `@repo/errors` / `@repo/contract` change →
      constructor contract preserved, both runtimes (edge `proxy.ts` + node
      `dept-access.ts`) still import ACL from `@repo/acl`
- [ ] **Cache/auth**: role/department mutation path evicts
      `arch:auth:employee:<userId>` via `POST /api/cache/invalidate`

### Deploy
- [ ] Confirm `docker-compose.production.yml` + `.env.production` are current
- [ ] Run the project deploy entrypoint (`deploy-production.sh` /
      `scripts/deploy-production.sh`) per `docs/deployment/`
- [ ] Supabase stack: on-prem Docker only (`pnpm supabase:start`-equivalent) —
      never introduce external cloud project links (AGENTS.md Supabase policy)
- [ ] Apply migrations in order; verify each in Studio before proceeding
- [ ] Run the portal smoke harness: `apps/portal/.claude/skills/run-portal/smoke.sh`
      (boot + `/login` readiness + optional screenshot)
- [ ] Monitor error rate + latency for 15 min; verify key user flows

### Post-Deploy
- [ ] Confirm metrics nominal (Redis hit rate, Supabase latency, portal uptime)
- [ ] Append a row to `docs/REPO-CHANGE-INDEX.md` (Area: `deployment` or the
      change's wayfinder concept)
- [ ] Update release notes / changelog; notify stakeholders; close related work

### Rollback Triggers (decide BEFORE deploying, not during)
- [ ] Error rate exceeds [X]% over [window]
- [ ] P50 latency exceeds [X]ms
- [ ] A critical user flow (login, department route, [key flow]) fails
- [ ] Rollback procedure: revert migration(s) in reverse order; redeploy prior
      image; re-run smoke harness
```

### Step 3

If `$ARGUMENTS` named a change type, pre-check the matching change-specific box
and fill the rollback thresholds with sensible defaults, then ask the user to
confirm/adjust before treating the checklist as satisfied.