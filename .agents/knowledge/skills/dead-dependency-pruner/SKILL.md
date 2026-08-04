---
name: dead-dependency-pruner
description: Workflow for auditing unused package dependencies across Turborepo apps, performing zero-import checks, and updating lockfiles safely.
---

# Dead Dependency Pruner Skill

Use this skill when performing dependency hygiene, reducing Turborepo bundle sizes, or clearing peer-dependency warnings.

## 1. Audit Strategy

1. Identify candidate unused dependencies in `package.json` across `apps/portal`, `packages/*`.
2. Perform a codebase-wide `grep` search to verify zero imports:

```bash
# Check if package 'foo' is imported anywhere in portal src
pnpm exec ripgrep -g "!**/node_modules/**" -g "!**/.next/**" "from ['\"]foo['\"]|require\(['\"]foo['\"]\)" apps/portal/src
```

3. If zero imports are found, remove the dependency entry from the targeted `package.json`.
4. Run `pnpm install` to update `pnpm-lock.yaml`.
5. Run full quality gate with forced cache (turbo caches stale lint PASS):
   ```bash
   pnpm exec turbo run lint type-check test --force   # MUST show "0 cached"
   pnpm format:check
   ```

## 2. Best Practices

- Never remove dependencies used solely in build configs (e.g., `@babel/core`, `@next/bundle-analyzer`, `next-swagger-doc`).
- Always run `pnpm --filter portal type-check` after pruning.
