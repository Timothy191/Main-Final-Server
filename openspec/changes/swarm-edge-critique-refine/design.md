## Context

Arch Systems already runs a multi-agent fleet under `.cursor/agents/` with auto-routing (`.cursor/rules/04-subagent-auto-routing.mdc`), gold contract, and skills for formal score (`agent-alignment-score`) and Hermes-style distill (`skill-self-improve`). Prior research mapped GPTSwarm (graph agents + edge optimization) and Critique-Refine (Generate→Critique→Refine) as documentation patterns—not as a Python runtime to vendor. AgentPipe was skipped; awesome-agent-evolution stays an on-demand catalog.

## Goals / Non-Goals

**Goals:**

- One shared progressive-disclosure reference for Edge optimization + Critique→Refine
- Thin pointers from owning agents (and optionally skills) so loops are discoverable
- Lean one-line note in the auto-routing rule
- Validate via OpenSpec + `pnpm ai check`

**Non-Goals:**

- New agents (including gold-standard-enforcer)
- Product UI / portal changes
- Vendoring GPTSwarm or adding Python deps
- Softening AGENTS.md policy
- Full telemetry/metrics backend for edge scores (doc patterns + optional lightweight logging guidance only)
- AgentPipe integration
- Updating AGENTS.md / agents README inventory (no new agents)

## Decisions

1. **Shared ref path:** `.cursor/agents/_shared/references/swarm-edge-critique-refine.md`
   - **Why:** Matches existing progressive-disclosure shared refs (`gold-standard-contract.md`, `agent-skills-runtime.md`). One file covers both patterns so agents load once.
   - **Alternative:** Per-agent duplicated sections — rejected (drift + token bloat).

2. **No new agent:** Patterns are references + wiring.
   - **Why:** Owners already exist (agency-lead orchestrates; routing-optimizer edges; sceptic critiques; root-cause-healer refines; score skill formalizes).
   - **Alternative:** `swarm-edge-optimizer` agent — rejected (inventory churn; duplicates routing-optimizer / agency-lead).

3. **Entry wiring = link only:** Add a Contracts or Workflow bullet pointing at the shared ref; keep body lean (≤65 lines). If an agent needs role-specific notes, put them in `<agent>/references/` with a one-liner back to the shared doc.
   - **Why:** Layout standard (`.cursor/standards/agent-layout/STANDARD.md`).

4. **Auto-routing rule:** One short pointer under Rules or near inventory — e.g. “Swarm edge / Critique→Refine: `_shared/references/swarm-edge-critique-refine.md`”.
   - **Why:** Always-on rules must not grow tables (user constraint + progressive disclosure).

5. **Optional agents:** `gap-analyst` / `patch-builder` get the same short link for analyze→implement rounds under agency-lead; not mandatory for validate if time-boxed, but preferred for completeness.
   - **Why:** They already form Round 1 / Round 2 of the healing agency.

6. **Optional skill:** `skill-self-improve` — add a brief “after successful Critique→Refine / edge prune” note in SKILL.md or `references/` without exceeding skill line limits.
   - **Why:** Adaptive loop already owns distill; this only names the swarm loop as a trigger context.

7. **Formal score ownership unchanged:** `agent-alignment-score` skill only. Critique estimate stays `sceptic`.
   - **Why:** Gold contract ownership split.

8. **Kiro coexistence:** No `.kiro/specs/` required for docs/AI-surface-only work; OpenSpec change is the lifecycle record. If later implementation expands beyond AI surfaces, create Kiro specs per AGENTS.md.

## Risks / Trade-offs

| Risk                          | Mitigation                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Always-on rule bloat          | Hard cap: one-line pointer only                                                  |
| Entry files exceed 65 lines   | Move any expanded text to `references/` or shared doc; re-run `pnpm ai check`    |
| Agents ignore shared ref      | Put link in Contracts section (high visibility); mention in agency-lead workflow |
| Confusion with formal score   | Explicitly state no gold-standard-enforcer; score = skill                        |
| Scope creep into product code | Spec + tasks forbid `apps/portal/` and vendoring                                 |

## Migration Plan

1. Land OpenSpec artifacts (this change) and validate.
2. Apply tasks: write shared ref → wire agent pointers → optional skill → lean rule pointer → `pnpm ai check`.
3. Rollback: delete shared ref + revert pointer diffs (docs-only; no schema/data).

## Open Questions

- None blocking. Optional: whether `gap-analyst` / `patch-builder` / `skill-self-improve` are required in the first apply pass (design prefers include; tasks mark optional as checkboxes).
