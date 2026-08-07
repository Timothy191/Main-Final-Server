# Kiro Session Bootstrap

> **Provenance:** Originally claimed created by the Kiro row in `docs/REPO-CHANGE-INDEX.md` (2026-08-05) alongside `STORE.md` and `SESSION-CACHE.md`, but never committed. Restored on 2026-08-06 with content authored from that row's summary. See `docs/caching/agent-token-strategy.md` for the full token-saving guide.

## Onboarding (every session start)

1. Read `.agents/skills/agent-caching/STORE.md` first (cross-session shared state, Section 10 = last known state).
2. Read `.agents/skills/agent-caching/SESSION-CACHE.md` and check the CURRENT SESSION block before asking the user what is in progress.
3. Read `AGENTS.md` (canonical policy) and `docs/WAYFINDER.md` for the domain being touched.
4. Load path-scoped rules from `.claude/rules/` matching the files in scope; do not load everything.

## Token-Saving Habits

- Batch independent tool calls into a single message (each message carries ~19-22K fixed tokens).
- Read only the section you need (`view` with `offset`/`limit`), never whole files.
- Use symbol-level operations (`lsp_definition`, `lsp_references`, `lsp_symbols`) instead of grepping and re-reading.
- Compress tool outputs to `✓`/`✗` + failure detail only, per `docs/context_efficiency.md`.
- Write durable findings to STORE.md once at session end; do not regenerate cached knowledge.

## Anti-Patterns

- Re-reading files already read this session (track in SESSION-CACHE.md FILES ALREADY READ).
- Serializing independent tool calls (grep, then another grep, then a read).
- Copying whole command outputs into the transcript.
- Letting CLAUDE.md/AGENTS.md absorb detail that belongs in linked docs (progressive disclosure).
- Trusting remembered state instead of re-verifying via git or `check_context.sh`.

## Pre-Done Checklist (before declaring a task done)

- [ ] `.scripts/check_context.sh` exits 0
- [ ] `node tools/agents-verify.mjs` passes
- [ ] `docs/REPO-CHANGE-INDEX.md` row appended
- [ ] `.agents/AGENT_TRACER.md` entry appended
- [ ] SESSION-CACHE.md CURRENT SESSION updated (or archived to PREVIOUS SESSIONS)

## Tool Preferences

- Package manager: `pnpm` (9.15.9, workspaces + Turborepo). Run per-package checks with `pnpm --filter <pkg> <cmd>`.
- Quality gates: always `pnpm exec turbo run lint type-check test --force` (turbo caches `lint` otherwise).
- Backend data: `@repo/supabase` clients server-side; `@repo/database` (Kysely) is for type generation only.
- Edge auth/ACL: `apps/portal/src/proxy.ts` + `@repo/acl`; never duplicate ACL logic inline.
