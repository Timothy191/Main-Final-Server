# Layer Boundary Standard

Two layers share one git repo. They must not share a runtime dependency graph.

| Layer | Purpose | Required to ship product? |
| ----- | ------- | ------------------------- |
| **Product monorepo** | Build, run, test, deploy the portal | **Yes** |
| **Agentic AI** | CLI agents, skills, rules, OpenSpec, `pnpm ai` | **No** |

## Product monorepo (standalone)

```
apps/portal/          # Next.js 16 — only deployable UI
apps/ops-gateway/     # Ops bridge (not the app shell)
packages/*            # @repo/* libraries
scripts/dev.sh        # Product boot
scripts/shutdown.sh
scripts/validate-env.sh
scripts/backup-db.sh
scripts/deploy-production.sh
scripts/portal-watchdog.sh
scripts/open-*.sh
pnpm-workspace.yaml
turbo.json
package.json scripts: build | dev | lint | type-check | test | quality | format*
```

**Hard rules**

1. `apps/` and `packages/` MUST NOT import or read `.cursor/`, `.claude/`, `.qoder/`, `AGENTS.md`, or `scripts/ai.sh`.
2. Product commands (`pnpm build`, `pnpm quality`, `pnpm dev`) MUST succeed with agentic trees deleted or absent.
3. Product Prettier/ESLint ignore agentic paths (see `.prettierignore`, `.eslintignore`).
4. `scripts/dev.sh` MUST NOT call `pnpm ai` / `scripts/ai.sh`.

## Agentic AI (CLI agents only)

```
AGENTS.md CLAUDE.md SOUL.md .cursorrules
.cursor/          # rules, agents, skills, standards, hooks, mcp
.claude/          # Claude Code mirror
.qoder/ .github/skills/ .kiro/ .agents/
openspec/ agent-harnesses/
scripts/ai.sh agency-loop.sh delegate-agent.sh
scripts/mcp-manager.sh provider-router.sh agent-runner.ts
scripts/auto-skill-miner.py test-autonomous-dispatch.sh
package.json scripts: ai* | agent* | agency* | mcp* | provider:route | lsp*
```

**Hard rules**

1. Agentic content may *describe* the product; it must never be a build input.
2. `pnpm ai` validates AI surfaces only — never gate product CI on it unless a dedicated optional job.
3. Agents edit product code via tools; product runtime never loads agent files.

## Allowed coupling (docs only)

- Humans/agents read `AGENTS.md` while coding — not imported by TypeScript.
- Root `package.json` may list both script families; product scripts must not invoke AI scripts.

## Verify separation

```bash
# Product path (must not touch .cursor)
pnpm build
pnpm quality
pnpm --filter portal type-check

# Agentic path (optional)
pnpm ai check
```

Smoke: temporarily rename `.cursor` → `.cursor.off`; `pnpm --filter portal type-check` **and** `pnpm --filter portal build` must still pass.

`apps/ops-gateway` is product ops (MCP-facing), not Layer-2 agent content — see `AGENTS.md` monorepo layout.
