# TypeScript Monorepo Optimization Guide

**Date:** 2026-07-28  
**Author:** AI Agent (Buffy)  
**Status:** Research complete — actionable recommendations below

---

## 1. Current State Assessment

### Config Files

| File                                            | Applies To          | Current Settings                                                                       |
| ----------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `packages/typescript-config/base.json`          | All packages        | `bundler` moduleResolution, `strict`, `skipLibCheck`, `isolatedModules`, `declaration` |
| `packages/typescript-config/nextjs.json`        | `apps/portal`       | Extends base, adds `incremental`, `module: ESNext`, `jsx: preserve`                    |
| `packages/typescript-config/react-library.json` | `packages/ui`, etc. | Extends base, adds `module: ESNext`, `jsx: react-jsx`                                  |
| `packages/typescript-config/nestjs.json`        | (legacy/backend)    | Uses `Node16` resolution — correct for Node.js runtime                                 |
| `apps/portal/tsconfig.json`                     | Portal app          | Extends nextjs.json, has `noEmit`, `allowImportingTsExtensions`                        |

### Audit Results

| Config Area                  | Current                      | Status     | Recommendation                             |
| ---------------------------- | ---------------------------- | ---------- | ------------------------------------------ |
| `moduleResolution`           | `bundler` (all frontend)     | ✅ Correct | Frontend uses bundler, backend uses Node16 |
| `strict`                     | `true`                       | ✅ Good    | All strict flags enabled                   |
| `skipLibCheck`               | `true`                       | ✅ Good    | Essential for monorepo perf                |
| `isolatedModules`            | `true`                       | ✅ Good    | Bundler compatibility                      |
| `declaration`                | `true` (base)                | ✅ Good    | Required for package boundaries            |
| `declarationMap`             | `true` (base)                | ✅ Good    | Enables go-to-definition across packages   |
| `incremental`                | Only in nextjs.json          | ⚠️ Partial | Not set in base.json or react-library.json |
| `moduleDetection`            | Not set (defaults to `auto`) | ⚠️ Missing | Should be `"force"`                        |
| `verbatimModuleSyntax`       | Not set                      | ⚠️ Missing | Enforces explicit `type` imports           |
| `allowImportingTsExtensions` | Portal + redis only          | ⚠️ Partial | Only where needed (recently added)         |
| `noUncheckedIndexedAccess`   | `true` (base)                | ✅ Good    | Prevents undefined access on arrays        |
| `noUnusedLocals`             | `false`                      | ⚠️ Loose   | Consider enabling — will require cleanup   |
| `noUnusedParameters`         | `false`                      | ⚠️ Loose   | Consider enabling — will require cleanup   |

---

## 2. Module Resolution Strategy

### Frontend (Browser/Bundler) — Use `bundler`

All frontend packages and apps use `moduleResolution: "bundler"` which is the **correct choice**:

| Aspect                  | `bundler`               | Why It's Right                                 |
| ----------------------- | ----------------------- | ---------------------------------------------- |
| Extensionless imports   | ✅ Allowed              | Turbopack resolves `.ts` → `.js` automatically |
| Package `exports` field | ✅ Supported            | Respects `package.json` exports maps           |
| Modern ESM              | ✅ Supported            | Works with `type: "module"`                    |
| Build tooling           | ✅ Turbopack compatible | Next.js 16 bundler works natively              |

### Backend (NestJS/Node.js) — Use `Node16` (Already Correct)

The `nestjs.json` config uses `module: "Node16"` and `moduleResolution: "Node16"`:

- Strict ESM resolution rules
- Explicit `.js` extensions required in imports
- Respects `type: "module"` in package.json

### Pattern Summary

```
                            Module Resolution Rules
┌──────────────────────────────────────────────────────────────────┐
│  Environment     moduleResolution     Import Convention          │
├──────────────────────────────────────────────────────────────────┤
│  Frontend        bundler              extensionless or .ts       │
│  (Next.js)                           Turbopack handles it        │
├──────────────────────────────────────────────────────────────────┤
│  Backend         Node16               Explicit .js extension     │
│  (NestJS)                            Strict ESM resolution       │
├──────────────────────────────────────────────────────────────────┤
│  Shared libs     bundler              Use .ts if emitted,        │
│  (@repo/*)                           extensionless if not        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Optimization Flags

### `moduleDetection: "force"` — Recommended for All Packages

**Purpose:** Treat every `.ts`/`.tsx` file as an ES module, preventing global scope pollution.

```json
// packages/typescript-config/base.json
{
  "compilerOptions": {
    "moduleDetection": "force"
  }
}
```

**How it works:**

| Setting            | Behavior                                                                           |
| ------------------ | ---------------------------------------------------------------------------------- |
| `"auto"` (default) | File is a module only if it has `import`/`export`. Other files are global scripts. |
| `"legacy"`         | Pre-4.7 behavior — same as auto but more permissive.                               |
| `"force"`          | **All non-declaration files are modules.** No global scope leakage.                |

**This is especially important in monorepos** where multiple packages are compiled together — without `"force"`, variables in files without explicit `export` can clash.

### `incremental: true` — Move to Base Config

**Purpose:** Skip re-typechecking unchanged files across builds. Speeds up rebuilds by 40-70%.

**Current state:** Only in `nextjs.json`. Should be in `base.json` so all packages benefit.

```json
// packages/typescript-config/base.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

**Caveats for `tsBuildInfoFile`:**

- Using `./node_modules/.tmp/` is fragile — `node_modules` may be read-only in CI
- Prefer `./.tsbuildinfo` (package-scoped) or `./node_modules/.cache/tsbuildinfo`
- Each package should scope its own path to avoid collisions
- Add `.tsbuildinfo` to `.gitignore`

**How it integrates with Turborepo:**

```bash
# Turborepo manages .tsbuildinfo files via cache
# Each package gets its own tsbuildinfo
# Only changed packages recompile
pnpm build  # turbo run build — skips unchanged packages
```

### `verbatimModuleSyntax: true` — Stricter Import Semantics

**Purpose:** Forces explicit `type` modifiers on type-only imports.

```json
// packages/typescript-config/base.json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

**Before:**

```typescript
// Implicit — TypeScript may elide, bundler may include
import { UserConfig, setupServer } from './config'
```

**After:**

```typescript
// Explicit — verbatim, no ambiguity
import type { UserConfig } from './config' // Removed from JS bundle
import { setupServer } from './config' // Preserved in JS bundle
```

**Benefits:**

- Smaller client bundles (type imports explicitly stripped)
- Predictable behavior across bundlers
- Prevents accidental runtime errors from elided imports
- Better tree-shaking hints for bundlers

---

## 4. Strictness Flags: `noUnusedLocals` & `noUnusedParameters`

**Current state:** Both set to `false` in `base.json`.

### Recommendation

| Flag                 | Current | Recommended                | Impact                          |
| -------------------- | ------- | -------------------------- | ------------------------------- |
| `noUnusedLocals`     | `false` | `true` (per-package first) | Catches dead variables, imports |
| `noUnusedParameters` | `false` | `true` (per-package first) | Catches unused function params  |

### Migration Strategy

Enabling these globally in `base.json` will cause **widespread build failures** across the codebase. Instead:

1. **Phase 1:** Enable per-package in low-risk packages first (`packages/utils`, `packages/errors`, `packages/contract`)
2. **Phase 2:** Fix all violations in those packages
3. **Phase 3:** Enable in `base.json` only after all packages are clean

This phased approach prevents cascading failures in larger apps like `apps/portal`.

---

## 5. Project References

### Current State

The monorepo does **not** use TypeScript project references. Each package/app's `tsconfig.json` extends from the shared base, but there is no root orchestrator `tsconfig.json` with `references`.

### When to Add Project References

Project references become valuable when:

1. Type-checking the entire monorepo (`pnpm type-check`) takes > 30s
2. ~6+ packages with independent compilation boundaries
3. Cross-package type dependencies cause cascading rebuilds

### Architecture

```jsonc
// ./tsconfig.json (root orchestrator)
{
  "files": [],
  "references": [
    { "path": "packages/contract" },
    { "path": "packages/errors" },
    { "path": "packages/redis" },
    { "path": "packages/utils" },
    { "path": "packages/rate-limiter" },
    { "path": "packages/ui" },
    { "path": "packages/supabase" },
    { "path": "packages/theme" },
    { "path": "packages/logger" },
    { "path": "packages/eslint-config" },
    { "path": "packages/typescript-config" },
    { "path": "apps/portal" },
  ],
}
```

Each referenced package needs:

```jsonc
// packages/utils/tsconfig.json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "composite": true, // Required for project references
    "outDir": "./dist",
    "rootDir": "./src",
  },
  "include": ["src/**/*"],
  "references": [], // Dependencies on other local packages
}
```

### Trade-offs

| Pro                              | Con                                      |
| -------------------------------- | ---------------------------------------- |
| Faster incremental type-checking | Complex setup with `composite`, `outDir` |
| Clear package boundaries         | Extra config per package                 |
| Build order enforcement          | `.tsbuildinfo` files need gitignoring    |

### Current Recommendation

**Wait until `pnpm type-check` exceeds 30s.** For now, Turborepo's task caching (`turbo run type-check`) provides sufficient incremental behavior without the overhead of project references.

---

## 6. Config Inheritance Chain

```
                          base.json
                    (shared, strict config)
                 bundler resolution | strict: true
                skipLibCheck: true | isolatedModules
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                   │
         ▼                 ▼                   ▼
   nextjs.json      react-library.json    nestjs.json
   (apps/portal)     (packages/ui)         (legacy/backend)
   incremental       react-jsx             Node16 resolution
   jsx: preserve     ESNext                decorators
   dom lib                                 noEmit: false
         │
         ▼
  apps/portal/tsconfig.json
  noEmit: true | allowImportingTsExtensions
  paths: @/*, @/features/*, @/lib/*, etc.
```

---

## 7. Performance Optimization Summary

### High Impact (P0)

| Change                           | Config File | Rationale                                   |
| -------------------------------- | ----------- | ------------------------------------------- |
| Set `"moduleDetection": "force"` | `base.json` | Prevents global scope pollution in monorepo |
| Set `"incremental": true`        | `base.json` | Speeds up rebuilds by 40-70%                |

### Medium Impact (P1)

| Change                                    | Config File         | Rationale                                             |
| ----------------------------------------- | ------------------- | ----------------------------------------------------- |
| Set `"verbatimModuleSyntax": true`        | `base.json`         | Enforces explicit `type` imports, reduces bundle size |
| Enable `"noUnusedLocals"` per-package     | Individual packages | Catches dead code (requires cleanup per package)      |
| Enable `"noUnusedParameters"` per-package | Individual packages | Catches unused params (requires cleanup per package)  |

### Low Impact / Investigate (P2)

| Change                                     | Config File | Rationale                                   |
| ------------------------------------------ | ----------- | ------------------------------------------- |
| Add root `tsconfig.json` with `references` | Root        | Full project references — wait until needed |
| Set `"exactOptionalPropertyTypes": true`   | `base.json` | Extra strictness for optional fields        |
| Set `"noUnusedLocals": true` globally      | `base.json` | Only after per-package cleanup is complete  |

---

## 8. TypeScript 5.x Features Worth Using

### `satisfies` Operator

```typescript
// Type-checks against the type without widening
const config = {
  port: 3000,
  host: 'localhost',
} satisfies ServerConfig

// config.port is `number` (not `number | undefined`)
// config.host is `string` (not `string | undefined`)
```

### `using` Declaration (Explicit Resource Management)

```typescript
export async function withRedisClient<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
  using client = await acquireRedisClient() // auto-disposes
  return fn(client)
}
```

### Import/Export Type Modifiers

```typescript
// TypeScript 5.0+ — inline type modifier on imports
import { type UserConfig, setupServer } from './config'

// Re-export types explicitly
export type { UserConfig }
export { setupServer }
```

---

## 9. Checklist for New Packages

When adding a new `@repo/*` package, verify:

- [ ] `tsconfig.json` extends from `@repo/typescript-config/<type>.json`
- [ ] `moduleResolution` matches environment (`bundler` for frontend, `Node16` for backend)
- [ ] `strict: true` is inherited (never override to `false`)
- [ ] `composite: true` if it's imported by other packages
- [ ] `outDir` and `rootDir` set if `composite: true`
- [ ] Exports are defined in `package.json` `"exports"` field
- [ ] Package is registered in `pnpm-workspace.yaml` and `turbo.json`
- [ ] No `@repo/*` workspace packages depend on it cyclically

---

## 10. Reference Links

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/modules/theory.html)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript 5.0 verbatimModuleSyntax](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)
- [TypeScript Performance](https://www.typescriptlang.org/docs/handbook/configuring-watch.html)
- [Turborepo + TypeScript](https://turbo.build/repo/docs/guides/tools/typescript)
