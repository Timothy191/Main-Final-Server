# Project Subagents

Cursor loads **flat entry files** only: `.cursor/agents/<name>.md`.
Collateral: `.cursor/agents/<name>/{references,scripts,assets}/`.

**Layout standard:** [`.cursor/standards/agent-layout/STANDARD.md`](../standards/agent-layout/STANDARD.md)
**Auto-routing:** [`.cursor/rules/04-subagent-auto-routing.mdc`](../rules/04-subagent-auto-routing.mdc)

## Agents

| Entry                                                    | Role                                     | Collateral                                             |
| -------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| [agents-memory-updater.md](agents-memory-updater.md)     | AI-surface + docs drift; agent memory    | [agents-memory-updater/](agents-memory-updater/)       |
| [backend-architect.md](backend-architect.md)             | API design, service architecture         | [backend-architect/](backend-architect/)               |
| [db-optimizer.md](db-optimizer.md)                       | PostgreSQL / Supabase performance        | [db-optimizer/](db-optimizer/)                         |
| [frontend-design.md](frontend-design.md)                 | Branded / landing visual composition     | [frontend-design/](frontend-design/)                   |
| [frontend-implementer.md](frontend-implementer.md)       | Portal UI implementation                 | [frontend-implementer/](frontend-implementer/)         |
| [import-auditor.md](import-auditor.md)                   | Import / path connectivity audit         | [import-auditor/](import-auditor/)                     |
| [nextjs-fullstack.md](nextjs-fullstack.md)               | Next.js full-stack vertical slices       | [nextjs-fullstack/](nextjs-fullstack/)                 |
| [reverse-engineer.md](reverse-engineer.md)               | External repo analysis & extraction      | [reverse-engineer/](reverse-engineer/)                 |
| [root-cause-healer.md](root-cause-healer.md)             | Verify hypothesis → fix → harden         | [root-cause-healer/](root-cause-healer/)               |
| [sceptic.md](sceptic.md)                                 | Adversarial review                       | [sceptic/](sceptic/)                                   |
| [test-engineer.md](test-engineer.md)                     | Test automation, flake diagnosis         | [test-engineer/](test-engineer/)                       |
| [vercel-brand-sync.md](vercel-brand-sync.md)             | Vercel-family brand assets               | [vercel-brand-sync/](vercel-brand-sync/)               |

> **Pruned 2026-07-25.** ~50 external-brand stubs (aider, devin, goose, opencode, omp, openspec, open-swe, adk/gaai/dev-tools-specialist, zeroclaw) and duplicates of `.qoder/` agents/skills were removed. Some surviving agents' `references/` subfolders still mention removed agents (e.g. `patch-builder`, `ai-docs-sync`, `gap-analyst`, `spec-auditor`, `routing-optimizer`, `agency-lead`, `ai-system-optimizer`, `fast-outliner`) — treat those mentions as historical; use the survivors above or `.qoder/skills/` counterparts.

## Shared

- [_shared/references/](_shared/references/) — gold contract, skills runtime, ACI, CLI matrix, knowledge base
- [_shared/references/agent-families.md](_shared/references/agent-families.md) — superagent families (references some pruned agents; historical)

## Cross-tool counterparts

Prefer these `.qoder/` surfaces where they exist:

| Concern                            | Qoder surface                              |
| ---------------------------------- | ------------------------------------------ |
| Multi-agent orchestration          | `.qoder/agents/prompt-orchestrator.md`     |
| Adversarial review + telemetry     | `.qoder/agents/overwatch.md`               |
| Security implementation            | `.qoder/agents/secure-builder.md`          |
| Research / codebase scholar        | `.qoder/agents/code-scholar.md`            |
| AI-surface engineering             | `.qoder/agents/agent-engineer.md`          |
| Spec lifecycle                     | `.qoder/skills/specs/`                     |
| Quality gate / verify              | `.qoder/skills/quality/`, `.qoder/skills/verify/` |
| Deploy                             | `.qoder/skills/deploy/`                    |
| Dev stack orchestration            | `.qoder/skills/dev/`                       |
| RLS migration audit                | `.qoder/skills/rls-audit/`                 |

## Validate

```bash
pnpm ai:check
```

## Related

- Skills: `.cursor/skills/README.md`
- Commands: `.cursor/commands/` (e.g. `/swarm`)
- Hooks: `.cursor/hooks.json`
- Kiro gates: `.kiro/agents/default.json`
