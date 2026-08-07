# Codegraph Implementation Completeness Rule

## Rule: Full Action Completion Principle

When an agent is busy implementing a task using Codegraph (or any other tool), **every action taken must be fully completed** before moving on. This means:

### 1. **Imports and Exports Must Be Updated**

If you add, modify, or remove a file that exports symbols used elsewhere:

- ✅ Update all importing files across the codebase
- ✅ Verify no broken imports remain
- ✅ Check barrel exports (`index.ts` files) for consistency
- ✅ Update package `exports` maps if the package boundary changed

**Example:** If you rename `packages/utils/src/types.ts` → `types.ts`, you must:

- Update all `import { Type } from '@repo/utils/src/types'` references
- Update `packages/utils/src/index.ts` re-exports
- Update `packages/utils/package.json` exports if aliased

### 2. **Configuration Must Propagate**

If you create or modify a file that is referenced by configuration:

- ✅ Update `tsconfig.json` path aliases if file moved
- ✅ Update `turbo.json` global dependencies if config changed
- ✅ Update `.eslintrc` import boundaries if package structure changed
- ✅ Update `knip.json` if new entry points or ignored files

### 3. **Documentation Must Reflect Changes**

- ✅ Update `AGENTS.md` files if rules or conventions changed
- ✅ Update `docs/REPO-CHANGE-INDEX.md` with a new entry
- ✅ Update `docs/WAYFINDER.md` if new concepts/directories added
- ✅ Update relevant `docs/` subfiles if behavior changed
- ✅ Add or update `CLAUDE.md` / `CLAUDE.local.md` per project norms

### 4. **Tests Must Be Verified**

- ✅ If modifying a module with existing tests, run those tests
- ✅ If adding a new feature, add tests where the coverage thresholds require it:
  - Lines: 40%, Branches: 30%, Functions: 35%, Statements: 40%
- ✅ Update test fixtures/mocks if interfaces changed
- ✅ Add unit tests for new logic in `src/lib/` or `src/hooks/`

### 5. **Cross-Package Impact Validation**

When an action touches a shared package (`@repo/acl`, `@repo/contract`, `@repo/ui`, `@repo/redis`, `@repo/supabase`):

- ✅ Check all `@repo/*` dependents are type-checked
- ✅ Run `pnpm exec turbo run type-check --filter ...^<changed-package>`
- ✅ Verify no consumer breaks due to type/API changes
- ✅ Update `@repo/contract` Zod schemas if data shapes evolved

### 6. **CI Gate Compliance**

After any implementation:

- ✅ `pnpm lint:yaml` passes on modified YAML files
- ✅ `pnpm format:check` passes (run `pnpm format` if needed)
- ✅ `pnpm lint-markdown` passes on new/modified `.md` files
- ✅ `pnpm lint:css` passes if CSS was modified
- ✅ `pnpm guard:imports` passes if imports cross boundaries
- ✅ `pnpm audit:knip` — no new unused exports/dependencies

### 7. **AGENTS.md and Tracer Sync**

- ✅ If a new `AGENTS.md` is created for a package, ensure it's linked in the root `AGENTS.md`
- ✅ If a new rule/category is added to `.agents/rules/`, update `.agents/rules/INDEX.md`
- ✅ Append to `.agents/AGENT_TRACER.md` with: Agent, Timestamp, Purpose, Changes, Dependencies, Notes
- ✅ Add a `DRIFT SCORE: 0.0` line if no drift from plan (or the actual score)

## Enforcement

This rule is enforced through the CI gate suite (`pnpm gates`) and the quality gate (`pnpm quality`). Any implementation that leaves dangling imports, missing documentation, or failing checks is considered **incomplete** and must be addressed before the task is considered done.

## See Also

- [`docs/REPO-CHANGE-INDEX.md`](../REPO-CHANGE-INDEX.md) — Append-only changelog
- [`.agents/AGENT_TRACER.md`](../../.agents/AGENT_TRACER.md) — Agent activity log
- [`AGENTS.md`](../../AGENTS.md) — Full repository conventions
