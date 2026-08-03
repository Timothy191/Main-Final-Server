# Alignment Rubric

Canonical weights mirror `.cursor/rules/02-agent-scoring.mdc`.

| Dimension         | Pts | Pass criteria (real evidence)                                                       |
| ----------------- | --: | ----------------------------------------------------------------------------------- |
| Spec compliance   |  20 | Multi-file → requirements/design/tasks exist & followed; single-file → N/A full pts |
| Stack fidelity    |  15 | pnpm, Next 16 patterns, `@repo/*`, no banned deps                                   |
| Boundaries        |  15 | Server/client correct; no server-only imports in client                             |
| Security          |  20 | Zod on input; no secrets; no service-role leakage                                   |
| Quality gate      |  15 | `pnpm quality` (or scoped equivalent) passed this session                           |
| Real-world verify |  15 | Observed runtime/test/read evidence for the claim                                   |

**Pass threshold:** ≥ 80  
**Hard fail:** any AGENTS.md §18 never-do → score = 0
