## Why

The AI fleet already has orchestration (`agency-lead`), critique (`sceptic`), refine/heal (`root-cause-healer`), route health (`routing-optimizer`), and scoring (`agent-alignment-score`), but these loops are implicit and not documented as shared progressive-disclosure patterns. GPTSwarm-inspired edge optimization and Critique→Refine give operators a single reference for handoff scoring and the Generate→Critique→Refine→Score cycle—without vendoring GPTSwarm, adding Python deps, or creating new agents.

## What Changes

- Add a shared progressive-disclosure reference under `.cursor/agents/_shared/references/` documenting **Edge optimization** and **Critique→Refine**
- Wire short pointers (links only; entry files stay ≤65 lines) into owning agents: `agency-lead`, `routing-optimizer`, `sceptic`, `root-cause-healer`, and optionally `gap-analyst` / `patch-builder`
- Optionally point `skill-self-improve` at distill-after-successful-loop guidance
- Add a one-line pointer in `.cursor/rules/04-subagent-auto-routing.mdc` (no full tables in the always-on rule)
- **No** new agents (including no gold-standard-enforcer); formal score remains `agent-alignment-score`
- **No** product UI, **no** new Python deps, **no** GPTSwarm vendoring

## Capabilities

### New Capabilities

- `swarm-edge-critique-refine`: Shared docs + agent/skill wiring for GPTSwarm-inspired edge optimization (log/score handoffs, prune dead routes, prefer successful edges) and Critique→Refine (Generate → Critique/sceptic → Refine/heal → Score/agent-alignment-score), with optional distill via `skill-self-improve`

### Modified Capabilities

- (none — `openspec/specs/` has no prior capability for this surface)

## Impact

- **Surfaces touched:** `.cursor/agents/_shared/references/`, selected `.cursor/agents/<name>.md` + optional `references/` notes, optionally `.cursor/skills/skill-self-improve/`, `.cursor/rules/04-subagent-auto-routing.mdc`
- **Not touched:** `apps/portal/`, product packages, AGENTS.md inventory (no new agents), policy text in AGENTS.md (never softened)
- **Validation:** `pnpm ai check` after apply; OpenSpec validate for this change
- **Kiro:** `.kiro/specs/` not required for this docs/AI-surface-only change; OpenSpec is the lifecycle artifact
