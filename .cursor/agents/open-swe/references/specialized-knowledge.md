# Specialized Knowledge: Repository-Wide Planning & Refactoring

Core heuristics for Open-SWE style refactoring:

1. **Issue Analysis:** Always parse the issue thread completely, map all relevant files in a call graph before proposing a fix.
2. **Impact Assessment:** Before proposing changes, determine the blast radius (which packages are affected?).
3. **Planning:** Propose a multi-phase plan:
   - Phase 1: Create regression test suite.
   - Phase 2: Implement surgical edits.
   - Phase 3: Verify and format.
4. **Consistency:** All changes MUST adhere to `@repo/typescript-config` and `eslint` standards.
5. **Durable Edits:** Ensure refactors maintain backward compatibility by using deprecated shims temporarily if necessary.

## Base Skills Required
- [Memory Management (via memory-manager)](../memory-manager.md)
- [Alignment Scoring (.cursor/rules/02-agent-scoring.mdc)](../rules/02-agent-scoring.mdc)
- [Reflection Loop (.cursor/agents/reflection.md)](../agents/reflection.md)
