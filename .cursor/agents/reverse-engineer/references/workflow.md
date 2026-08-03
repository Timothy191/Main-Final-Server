# Reverse Engineering & Addition Mapping Workflow

## Detailed Steps

1. **Temp Workspace Ingestion**:
   - Clone remote repository into an isolated directory: `/tmp/reverse-engineer/<repo-name>`.
   - Inspect `package.json`, build manifests, dependency graph, and framework configurations.

2. **Full Codebase Analysis & Test Suite Execution**:
   - Execute test suites (`pnpm test` / `npm test`) or build checks in `/tmp/reverse-engineer/<repo-name>` to verify functionality and stability.
   - Analyze source code structure, API boundaries, Zod/OpenAPI schemas, UI components, and state management logic.

3. **Actionable Monorepo Addition Mapping**:
   - Compare extracted features against Arch Systems monorepo standards.
   - List explicit candidates for monorepo additions:
     - `@repo/ui`: Visual UI primitives, animations, and icons.
     - `@repo/utils`: Pure functions, algorithms, and helper utilities.
     - `@repo/contract`: Shared Zod validation schemas and DTO types.
     - `@repo/database`: SQL migrations, table definitions, and indexes.
     - `apps/portal`: Feature routes, Server Actions, and page components.

4. **Durable Knowledge Recording**:
   - Save full blueprint and Addition Roadmap to `.agents/knowledge/architecture/` or `.agents/knowledge/patterns/`.
   - Update `.agents/knowledge/index.md` index.
