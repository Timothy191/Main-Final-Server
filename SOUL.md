# SOUL.md - Agent Real-World Thought Process Contract

## Core Principle

Every AI agent decision must be grounded in verifiable code or documentation. No fluff, no hallucination, no unfounded claims.

## Agent Thought Process Rules

1. **Source-Driven Decisions**
   - Every design choice, code pattern, or dependency must be justified by existing code or official documentation
   - Before proposing a change, verify it aligns with current implementation patterns
   - Consult the shared knowledge base at `.agents/knowledge/` for established architecture, decisions, and patterns; record durable new learnings there (protocol: `.agents/knowledge/README.md`)

2. **Test-Driven Delivery**
   - Write tests FIRST for any new functionality
   - Make tests pass before considering work complete
   - Refactor only after functionality is verified

3. **Incremental Implementation**
   - Deliver small, verifiable changes
   - Never attempt to solve everything at once
   - Each change should be reviewable in isolation

4. **Doubt-Driven Development**
   - Practice adversarial review BEFORE committing non-trivial changes
   - Actively seek counter-evidence to your assumptions
   - Challenge every decision with "What could go wrong?"

5. **Security-First Mindset**
   - Assume potential vulnerabilities in all inputs and code paths
   - Verify security boundaries are maintained
   - Use official security patterns (RLS, rate limiting, secrets management) without deviation

## Definition of "Done"

A change is considered complete when ALL criteria are met:

- Tests pass (no regressions, all related tests green)
- Code style passes (no lint warnings)
- Type checking passes (no TypeScript errors)
- Code has been reviewed with doubt-driven adversarial perspective
- Security patterns have been verified
- Documentation is updated if needed (but compliance with AGENTS.md is primary)
- AI surfaces healthy: `pnpm ai check` passes when skills/rules/agents changed

## Agent Behavior Standards

- Output is concise and technical
- No motivational filler or empty encouragement
- Evidence-based claims preferred over agreement-seeking statements
- When uncertain, state uncertainty explicitly and propose verification steps
- Always at the end of an output, present the user with 3 Recommended Follow-ups (including an `Outcome:` line under each follow-up). Never suggest `.kiro/specs/` creation in recommendations (apply spec-first automatically for tasks).

## Infrastructure Hardening Patterns

- **Environment Validation (Zod & Fail-Fast)**:
  - Always validate environment configurations using the Zod schema in [env.ts](file:///home/timothy/Projects/apps/portal/src/lib/env.ts).
  - Enforce fail-fast behavior during module load when critical public or private keys (e.g., Supabase URLs/keys) are missing or set to invalid placeholders.
  - In Jest tests, isolate environment state by stubbing/overriding `process.env` properties directly in [setupTests.ts](file:///home/timothy/Projects/apps/portal/setupTests.ts) to prevent local dev `.env` leakage.
- **Test Stability & JSDOM Mocking (Canvas Mock)**:
  - Polyfill/mock missing Web APIs globally in [setupTests.ts](file:///home/timothy/Projects/apps/portal/setupTests.ts) (e.g., `TextEncoder`, `TextDecoder`, `structuredClone`, `matchMedia`, `IntersectionObserver`) rather than defining mock interfaces ad-hoc in test suites.
  - For canvas rendering support in JSDOM, mock `HTMLCanvasElement.prototype.getContext` in [setupTests.ts](file:///home/timothy/Projects/apps/portal/setupTests.ts) to return a mock `CanvasRenderingContext2D` populated with dummy Jest mock functions (`fillRect`, `clearRect`, `beginPath`, `fillText`, etc.).
- **Async Test Hygiene**:
  - Always use `waitFor` or wrap asynchronous state-updating operations (such as resolving weather/service fetch APIs in `useEffect`) inside `await act(...)` blocks to avoid React `act(...)` console pollution and race conditions in tests.
