# Design: AI surface superagent refactor

## Research summary

Industry (Cursor, Anthropic, agentskills.io, orchestrator–worker catalogs) converges on:

- **Parent orchestrates; specialists execute** — do not collapse into 3–5 god-agents.
- **Merge only same intent + same QA + competing triggers** — else sharpen descriptions.
- **Skills absorb procedure; agents absorb isolation** — demote one-shots to skills when no isolation benefit.
- **Progressive disclosure** — lean entries; detail in `references/`.

## Architecture decision

| Pattern | Use |
|---|---|
| **Canonical + thin alias** | Quality gate triad → `quality` |
| **Superagent family (docs)** | Healing under `agency-lead`; Portal under `nextjs-fullstack` (+ design/implement peers) |
| **True superagent (existing)** | `nextjs-fullstack` remains the only domain vertical-slice agent |
| **KEEP separate** | Layout trio, CLI trio, review/score split, AI maint trio |

## Files changed

| Path | Change |
|---|---|
| `.github/skills/verify-changes/` | Thin alias → `.qoder/skills/quality` full |
| `.cursor/agents/_shared/references/agent-families.md` | Superagent family map |
| `agency-lead.md`, `nextjs-fullstack.md`, `frontend-implementer.md` | Link families; sharpen anti-triggers |
| Layout `SKILL.md` trio | Cross-ref to family/index note |
| Inventories (AGENTS/CLAUDE/READMEs) | Alias + family pointers |
| `04-subagent-auto-routing.mdc` | Optional family note; no row deletes |

## Data / security

N/A — AI-surface docs only; no secrets.
