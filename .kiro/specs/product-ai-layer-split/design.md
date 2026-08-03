# Product ↔ Agentic AI Layer Split — Design

## Architecture

Two layers share one git repo; they do **not** share a runtime dependency graph.

| Layer | Owns | Ship-required? |
| ----- | ---- | -------------- |
| Product | `apps/portal`, `apps/ops-gateway`, `packages/*`, turbo, product scripts | Yes |
| Agentic AI | `.cursor/`, `.claude/`, skills/agents, `AGENTS.md`, `pnpm ai*`, agent scripts | No |

## Files changed

| File | Change |
| ---- | ------ |
| `scripts/dev.sh` | Remove `ai.sh` health probe from product boot |
| `.prettierignore` | Exclude agentic trees + policy markdown from product format |
| `.eslintignore` | Exclude agentic trees from product lint |
| `.cursor/standards/layer-boundary/STANDARD.md` | Canonical boundary contract |
| `AGENTS.md` | § Two Layers + command split |
| `CLAUDE.md` | Parity pointer |
| `.cursor/rules/00-global-alignment.mdc` | One-line two-layer reminder |

## Data / runtime flow

- Product boot: `pnpm dev` → `scripts/dev.sh` → portal only (no AI status).
- Product quality: turbo lint/type-check/test + Prettier on **non-ignored** paths only.
- Agentic: `pnpm ai` → `scripts/ai.sh` → validates `.cursor`/`.claude` only.

## Boundaries

- Server/client: unchanged (no app code edits).
- Root `package.json` may list both script families; product scripts must not call AI scripts.
- Root `@openrouter/*` remains install-time soft coupling (nit); not a runtime product import.

## Env / packages

- No new env vars.
- No new dependencies.
- No workspace/`turbo.json` task changes for AI.
