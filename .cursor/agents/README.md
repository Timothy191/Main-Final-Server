# Project Subagents

Cursor loads **flat entry files** only: `.cursor/agents/<name>.md`.  
Collateral: `.cursor/agents/<name>/{references,scripts,assets}/`.

**Layout standard:** [`.cursor/standards/agent-layout/STANDARD.md`](../standards/agent-layout/STANDARD.md)  
**Auto-routing:** [`.cursor/rules/04-subagent-auto-routing.mdc`](../rules/04-subagent-auto-routing.mdc)

## Agents

| Entry                                                  | Role                               | Collateral                                         |
| ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------- |
| [fast-outliner.md](fast-outliner.md)                   | Pre-flight scope, gaps, handoffs   | [fast-outliner/](fast-outliner/)                   |
| [frontend-design.md](frontend-design.md)               | Branded/landing visual composition | [frontend-design/](frontend-design/)               |
| [frontend-implementer.md](frontend-implementer.md)     | Portal UI implementation           | [frontend-implementer/](frontend-implementer/)     |
| [nextjs-fullstack.md](nextjs-fullstack.md)             | Next.js full-stack vertical slices | [nextjs-fullstack/](nextjs-fullstack/)             |
| [ai-docs-sync.md](ai-docs-sync.md)                     | AI surfaces + docs drift           | [ai-docs-sync/](ai-docs-sync/)                     |
| [sceptic.md](sceptic.md)                               | Adversarial review                 | [sceptic/](sceptic/)                               |
| [idle-runner.md](idle-runner.md)                       | Parallel safe work while blocked   | [idle-runner/](idle-runner/)                       |
| [ai-maintenance-checker.md](ai-maintenance-checker.md) | Background AI layout janitor       | [ai-maintenance-checker/](ai-maintenance-checker/) |
| [auto-formatter.md](auto-formatter.md)                 | Background workspace code formatter| [auto-formatter/](auto-formatter/)                 |
| [reverse-engineer.md](reverse-engineer.md)             | External repo analysis & extraction| [reverse-engineer/](reverse-engineer/)             |
| [vercel-brand-sync.md](vercel-brand-sync.md)           | Vercel-family brand assets         | [vercel-brand-sync/](vercel-brand-sync/)           |
| [openspec.md](openspec.md)                             | OpenSpec change lifecycle (CLI)    | [openspec/](openspec/)                             |
| [aider.md](aider.md)                                   | Aider surgical headless edits      | [aider/](aider/)                                   |
| [goose.md](goose.md)                                   | Goose recipes / MCP automation     | [goose/](goose/)                                   |
| [omp.md](omp.md)                                       | omp heavy headless coding          | [omp/](omp/)                                       |
| [security.md](security.md)                             | AppSec, vuln review, threat model  | [security/](security/)                             |
| [test-engineer.md](test-engineer.md)                   | Test automation, flake diagnosis   | [test-engineer/](test-engineer/)                   |
| [db-optimizer.md](db-optimizer.md)                     | PostgreSQL/Supabase performance    | [db-optimizer/](db-optimizer/)                     |
| [backend-architect.md](backend-architect.md)           | API design, service architecture   | [backend-architect/](backend-architect/)           |
| [root-cause-healer.md](root-cause-healer.md)           | Verify hypothesis → fix → harden   | [root-cause-healer/](root-cause-healer/)           |
| [import-auditor.md](import-auditor.md)                 | Import/path connectivity audit     | [import-auditor/](import-auditor/)                 |
| [agency-lead.md](agency-lead.md)                       | Background self-healing loops      | [agency-lead/](agency-lead/)                       |
| [gap-analyst.md](gap-analyst.md)                       | Compile/gap log analysis           | [gap-analyst/](gap-analyst/)                       |
| [spec-auditor.md](spec-auditor.md)                     | OpenSpec/AGENTS compliance         | [spec-auditor/](spec-auditor/)                     |
| [routing-optimizer.md](routing-optimizer.md)           | Provider latency/cooldowns         | [routing-optimizer/](routing-optimizer/)           |
| [patch-builder.md](patch-builder.md)                   | Structural auto-patches            | [patch-builder/](patch-builder/)                   |
| [ai-system-optimizer.md](ai-system-optimizer.md)       | AI surface bloat/compliance        | [ai-system-optimizer/](ai-system-optimizer/)       |
| [agents-memory-updater.md](agents-memory-updater.md)     | Agent memory from transcripts       | [agents-memory-updater/](agents-memory-updater/)   |

## Shared

- [_shared/references/](_shared/references/) — gold contract, skills runtime, ACI, CLI matrix, knowledge base
- [_shared/references/agent-families.md](_shared/references/agent-families.md) — superagent families (orchestrators + specialists; not flattened agents)

## Validate

```bash
pnpm ai check
```

## Related

- Skills: `.cursor/skills/README.md`
- Commands: `.cursor/commands/` (e.g. `/swarm`)
- Hooks: `.cursor/hooks.json`
- Kiro gates: `.kiro/agents/default.json`
