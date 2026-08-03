# Cursor Skills

Skills are structured AI capabilities under `.cursor/skills/<name>/`. Each skill has a `SKILL.md` entry, optional `scripts/`, `references/`, and `assets/` directories.

## Skills Index

| Skill | Description |
|-------|-------------|
| `agent-alignment-score` | Formal Alignment Score (0–100) against AGENTS.md rubric. Use before claiming done or after multi-file changes. |
| `agent-layout` | Meta-skill for creating/refactoring Cursor subagents to the hybrid agent layout standard. |
| `ai-system` | Unified AI system check — guardrails, layouts, sync, dedupe, drift. Powers `pnpm ai`. |
| `claude-code-layout` | Validates and syncs Claude Code `.claude/` surfaces. |
| `continual-learning` | Updates agent memory from transcripts. Extracts high-signal recurring user corrections and durable workspace facts. |
| `provider-router` | Multi-provider AI router with key pool rotation and omni parallel routing. |
| `redis-caching` | L1/L2 cache design, cacheWrap usage, stampede prevention, cache invalidation via `@repo/redis`. |
| `skill-layout` | Meta-skill for creating/refactoring skills to the Agent Skills open standard (agentskills.io). |
| `skill-self-improve` | Hermes-style skill self-improvement: observe → distill → reuse → refine. |

## Layout Standard

Each skill folder follows:

```
<skill-name>/
  SKILL.md          # YAML frontmatter + lean body (≤80 lines)
  scripts/          # Subprocess helpers
  references/       # Detailed docs — load on demand
  assets/           # Templates, static outputs
```

See `.cursor/standards/agent-skills/STANDARD.md` for the full standard.

## Commands

- `pnpm ai check` — Validate all AI surfaces (skills, agents, guardrails, drift)
- `pnpm ai fix` — Safe repair + validate
