---
name: turborepo-type-resolution
description: Fixes TS2307 type compilation resolution quirks on monorepo workspaces by compiling dependency dist targets.
globs: '**/package.json'
---

# Turborepo Type Resolution

When working with pnpm workspaces, Next.js or Turborepo build gates can fail with `TS2307: Cannot find module '@repo/module'` if the dependency module has not compiled its TS files to the `dist` directory.

## Resolution

1. Ensure the dependency package compiles and outputs files by appending `--noEmit false` to its `tsconfig.json` or `tsc` CLI command.
2. In the dependency `package.json`:
   ```json
   "build": "tsc -p tsconfig.build.json --noEmit false"
   ```
3. Rebuild the dependency target package manually using `pnpm --filter @repo/package build` before running typechecks.
