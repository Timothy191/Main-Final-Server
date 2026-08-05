---
name: maintain-monorepo-hygiene
description: Keep the pnpm/Turborepo monorepo clean — avoid root barrel imports, share config packages, declare direct dependencies, and standardise path aliases.
---

# Maintain Monorepo Hygiene

Use this skill when refactoring imports, adding packages, or cleaning up the
Arch-Systems monorepo (`apps/portal`, `packages/*`).

## 1. Import Rules

### Prefer subpath imports over root barrel exports

The repo convention is to import from specific files, not root barrels:

- `@repo/redis` root only for symbols that have **no** subpath export (`getRedis`, `getNativeEventBus`).
  - Use `@repo/redis/client` for `getRedisClient`
  - Use `@repo/redis/stats` for `getCacheStats`
  - Use `@repo/redis/cache` for `cacheWrap`, `cacheDelete`, etc.
- `@repo/supabase` root only for true runtime entry points.
  - Use `@repo/supabase/server`, `@repo/supabase/client`, etc., for clients.
  - Use `@repo/supabase/types` for `Database`, row types, `SupabaseClient`.
- `@repo/ui` root is a legacy barrel; prefer:
  - `@repo/ui/components/ui/button` for primitives
  - `@repo/ui/GlassCard` for the glass card
  - `@repo/ui/PageHeader`, `@repo/ui/Pagination`, etc., for named components
  - `@repo/ui/lib/utils` for `cn`
- `@repo/theme` root is also a barrel; prefer `@repo/theme/tokens` for token values.

### Prefer `@repo/ui/lib/utils` inside `packages/ui`

Internal components must use the package alias instead of relative paths:

```tsx
// good
import { cn } from '@repo/ui/lib/utils'

// avoid
import { cn } from '../lib/utils'
```

## 2. Shared Config Packages

Before duplicating config, extend a shared package:

- `@repo/typescript-config` — add a new `.json` export for common patterns.
  - Example: `node-library.json` for packages with `src/` → `dist/` builds.
- `@repo/jest-config` — add a new base config file for common test setups.
  - Example: `node.js` for Node test environments.

## 3. Dependency Hygiene

Every package must declare its own dependencies. Do not rely on phantom hoisting:

- If a package imports `jest`, `@swc/jest`, `ts-jest`, etc., list them in `devDependencies`.
- If a package imports runtime libs (`ioredis`, `framer-motion`, `clsx`, `@supabase/supabase-js`, `@google/genai`), list them in `dependencies`/`devDependencies`.
- If a package imports another workspace package, use `workspace:*` and add it to deps.

After editing `package.json`, run `pnpm install` and commit `pnpm-lock.yaml`.

## 4. Path Aliases

Keep `tsconfig.json` paths honest:

- Remove dead aliases that point to nonexistent directories (e.g., `@repo/auth/*`, `@repo/shared/*`).
- Keep app-internal aliases: `@/*`, `@/lib/*`, `@/components/*`, etc.
- Add `@repo/ui/lib/*` mapping if it is missing.

## 5. Redundant Files

- Common `.gitignore` patterns belong in the root `.gitignore`.
- Delete package-level `.gitignore` files that only duplicate root rules.

## 6. Verification Checklist

- [ ] No root barrel imports where a subpath export exists.
- [ ] Internal `cn` imports use `@repo/ui/lib/utils`.
- [ ] Shared config packages export the new config in `package.json`.
- [ ] Every package declares its own test/runtime dependencies.
- [ ] `pnpm exec turbo run lint type-check test --force` passes with 0 cached.
- [ ] `pnpm format:check` passes.
