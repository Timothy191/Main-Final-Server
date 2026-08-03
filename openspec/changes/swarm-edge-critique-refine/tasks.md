## 1. Shared reference

- [x] 1.1 Create `.cursor/agents/_shared/references/swarm-edge-critique-refine.md` documenting Edge optimization (log/score handoffs, prune dead routes, prefer successful edges) and Critique→Refine (Generate → Critique/sceptic → Refine/heal → Score/agent-alignment-score)
- [x] 1.2 Explicitly state: no GPTSwarm vendoring, no new agents, formal score stays `agent-alignment-score`, AgentPipe skipped, awesome-agent-evolution on-demand only

## 2. Agent wiring (entries ≤65 lines)

- [x] 2.1 Add short Contracts/Workflow link in `agency-lead.md` (orchestration owner)
- [x] 2.2 Add short link in `routing-optimizer.md` (edge health / route priority)
- [x] 2.3 Add short link in `sceptic.md` (critique step)
- [x] 2.4 Add short link in `root-cause-healer.md` (refine/heal after critique)
- [x] 2.5 Optionally add short link in `gap-analyst.md` and `patch-builder.md` for analyze→implement rounds
- [x] 2.6 If any entry would exceed 65 lines, move notes to `<agent>/references/` instead of bloating the entry

## 3. Rule and optional skill

- [x] 3.1 Add one-line pointer in `.cursor/rules/04-subagent-auto-routing.mdc` to the shared ref (no full tables)
- [x] 3.2 Optionally note distill-after-successful-loop in `skill-self-improve` (SKILL.md or references/) without softening AGENTS.md

## 4. Inventory and scope guards

- [x] 4.1 Confirm no new agent files created; skip AGENTS.md / `.cursor/agents/README.md` inventory updates
- [x] 4.2 Confirm no product UI, no Python deps, no GPTSwarm vendor paths touched

## 5. Validate

- [x] 5.1 Run `openspec validate swarm-edge-critique-refine` (or headless validate)
- [x] 5.2 Run `pnpm ai check` with PATH including `~/.npm-global/bin`
