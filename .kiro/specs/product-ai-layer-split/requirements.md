# Product ↔ Agentic AI Layer Split — Requirements

## Intent

Keep the product monorepo (`apps/`, `packages/`, product scripts) **standalone**: it must build, type-check, and run without any Agentic AI content (`.cursor/`, `pnpm ai`, agent scripts). AI surfaces remain optional CLI-agent tooling only.

## Acceptance criteria

1. `apps/` and `packages/` have **zero** compile-time imports/requires of `.cursor/`, `.claude/`, `.qoder/`, `.github/skills`, `AGENTS.md`, `CLAUDE.md`, `openspec/`, or `agent-harnesses/`.
2. Product commands `pnpm build`, `pnpm quality`, `pnpm --filter portal type-check`, and `pnpm dev` do **not** invoke `scripts/ai.sh` / `pnpm ai`.
3. Product Prettier and ESLint ignore agentic trees so `pnpm quality` does not fail on AI-only markdown/config.
4. Boundary is documented in `.cursor/standards/layer-boundary/STANDARD.md` and mirrored in `AGENTS.md` § Two Layers (+ `CLAUDE.md` pointer).
5. Smoke: with `.cursor` absent/renamed, `pnpm --filter portal type-check` **and** `pnpm --filter portal build` succeed.
6. Portal in-app AI (`apps/portal/src/lib/ai`, `@ai-sdk`) remains **product** — not treated as Layer-2 coupling.
7. `apps/ops-gateway` is **product** ops bridge (MCP-facing control plane), not the app shell and not Layer-2 agent content. Relocating it is a separate design decision.

## Non-goals

- Moving OpenRouter / agent scripts to a separate package (optional polish)
- Relocating `ops-gateway` out of the workspace
- Making `pnpm ai` a product CI gate
- Changing portal runtime AI features
