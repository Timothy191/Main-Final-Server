# AI System Optimizer — Workflow Detail

Load on demand. Entry file stays ≤65 lines.

## 1. Bloat Detection & Pruning

- **Dead skills:** `SKILL.md` with 0 usage or `last_used` >30 days → flag/archive
- **Stale agents:** missing from `04-subagent-auto-routing.mdc` or no `description` → flag
- **Orphan references:** `_shared/references/` unused by agents/skills/scripts → consolidate
- **Duplicates:** skill/agent overlap >70% → merge or alias
- **Unused scripts:** not in `package.json` or rules → archive
- **Line limits:** agent entries >65, skill entries >80 → move to `references/`

## 2. Compliance Enforcement

- Rule frontmatter: `description` + (`globs` or `alwaysApply: true`)
- Every `.cursor/agents/<name>.md` mirrored in routing inventory / `AGENTS.md`
- pnpm-only gate (no `npm install` / `yarn add` in AI docs)
- Gold contract + Anti-trigger on every agent entry

## 3. Version Freshness

- Node ≥22, pnpm ≥9
- MCP: `.cursor/mcp-servers.json` vs `pnpm mcp:status`
- Optional CLI tools (`aider`, `omp`, …) — flag outdated only when checking freshness

## 4. Token & Cache Optimization

- Stable prefix first (policy, tool defs, skill catalog); dynamic suffix last
- Semantic cache candidates: `pnpm provider:route --check`, `pnpm mcp:status`, gap reports
- MCP tool defs sorted stable-first in config
- Prefer progressive disclosure over inlining long tables in entry files

## Dependencies

- `pnpm ai check`
- `pnpm mcp:status` (when MCP freshness in scope)
- `.cursor/rules/04-subagent-auto-routing.mdc`
- `.cursor/agents/_shared/references/knowledge-base.md`
