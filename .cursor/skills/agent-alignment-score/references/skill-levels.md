# Agent Skill Leveling System (v1.0.0)

Mapping agent proficiency to actionable improvement tiers. Based on `agent-alignment-score` (0-100).

| Level | Range | Descriptor | Performance Expectation |
| :--- | :--- | :--- | :--- |
| **L1-L3** | 0-49 | Novice | Task completion requires heavy parent intervention; frequent alignment errors. |
| **L4-L6** | 50-79 | Proficient | Consistent task completion; adheres to standard rules; requires occasional review. |
| **L7-L9** | 80-94 | Advanced | Proactive in following `AGENTS.md`; high-quality outputs; rare alignment drift. |
| **L10** | 95-100 | Master | Autonomous; self-improves via `skill-self-improve`; optimal token usage; zero-drift. |

## Evolution Mechanism
- **Level up condition:** Maintaining L9 status for 3 consecutive high-complexity tasks triggers an automatic `skill-self-improve` distillation of the agent's performance patterns.
- **Degradation:** Falling below L7 requires an immediate "Review/Refine" cycle via `sceptic` agent.
