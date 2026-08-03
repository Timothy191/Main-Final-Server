# Swarm Edge Optimization + Critique→Refine

Progressive-disclosure patterns inspired by GPTSwarm (graph agents / edge optimization) and Generate→Critique→Refine research loops. **Load on demand** — not always-on rule bulk.

## Scope guards

| Do                                                                                                            | Do not                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Document handoff scoring + critique loops                                                                     | Vendor GPTSwarm / AgentPipe / new Python deps                            |
| Wire thin links from owning agents                                                                            | Create new agents (no `swarm-edge-optimizer`, no gold-standard-enforcer) |
| Keep formal score on `agent-alignment-score`                                                                  | Soften `AGENTS.md`                                                       |
| Treat [awesome-agent-evolution](https://github.com/Shiyao-Huang/awesome-agent-evolution) as on-demand catalog | Embed survey lists into always-on rules                                  |

AgentPipe is **out of scope** (unreliable upstream).

## Edge optimization (handoff graph)

Treat the fleet as a directed graph: nodes = agents/skills; edges = delegations.

1. **Log** — each handoff: `from → to`, task signal, outcome (`ok` | `fail` | `skip`), one-line evidence.
2. **Score** — prefer edges with repeated `ok`; demote / cooldown edges with repeated `fail` or empty returns.
3. **Prune** — dead routes (never used, always fail, or anti-trigger mismatches) → recommend removal/update in `04-subagent-auto-routing.mdc` via `ai-docs-sync` (do not silently rewrite policy).
4. **Prefer** — when multiple agents match, choose the historically successful edge; tie-break with routing table Timing column.

**Owners**

| Role                                                   | Agent               |
| ------------------------------------------------------ | ------------------- |
| Orchestrate multi-agent cycles + aggregate edge health | `agency-lead`       |
| Probe providers + recommend route/priority shifts      | `routing-optimizer` |
| Round-1 failure surfaces that imply bad edges          | `gap-analyst`       |

Lightweight logging only (session notes / report templates). No metrics backend required.

## Critique→Refine loop

```
Generate (implementers / patch-builder)
    → Critique (sceptic — estimate only)
    → Refine (root-cause-healer / domain implementers)
    → Score (agent-alignment-score skill — formal)
    → optional Distill (skill-self-improve when Hermes criteria match)
```

| Step     | Owner                                                          | Notes                                               |
| -------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Generate | `patch-builder`, `nextjs-fullstack`, `frontend-implementer`, … | Produce the change                                  |
| Critique | `sceptic`                                                      | Adversarial verdict + estimate; **not** formal /100 |
| Refine   | `root-cause-healer` (+ specialists)                            | Fix gaps from critique; verify hypothesis           |
| Score    | `agent-alignment-score`                                        | Gold extended block; pass ≥80                       |
| Distill  | `skill-self-improve`                                           | After 3+ successes / Adaptive next                  |

## Agency round map

| Round     | Agents                                                 | Pattern               |
| --------- | ------------------------------------------------------ | --------------------- |
| Analyze   | `gap-analyst`, `spec-auditor`, `routing-optimizer`     | Edge + gap scan       |
| Implement | `patch-builder`                                        | Generate              |
| Close     | `sceptic` → refine if needed → `agent-alignment-score` | Critique→Refine→Score |

## Sources (ideas only)

- GPTSwarm — Language Agents as Optimizable Graphs ([arXiv:2402.16823](https://arxiv.org/abs/2402.16823))
- Generate–Critique–Refine self-reflection loops (research assistants / LangGraph patterns)
