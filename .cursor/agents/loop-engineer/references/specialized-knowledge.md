# Specialized Knowledge: Agentic Loop Optimization

Core heuristics for optimizing long-running agent loops:

1. **Efficiency Gate:** Before each loop iteration, ensure `memory-manager` has been queried for context to avoid re-work.
2. **Token Economy:** If an iteration exceeds $N$ tokens without observable progress, trigger `reflection` agent to prune the history.
3. **Loop Integrity:** Each iteration must end in a verifiable state (e.g., successful git commit or pass on regression tests).
4. **Self-Healing:** If an iteration fails, the loop-engineer MUST analyze logs with `root-cause-healer` before re-trying.

## Base Skills Required
- [Memory Management (via memory-manager)](../memory-manager.md)
- [Reflection Loop (.cursor/agents/reflection.md)](../agents/reflection.md)
- [DevTools Integration](../skills/dev-tools-integration/SKILL.md)
