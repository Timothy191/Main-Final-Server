---
title: Upgrading Next.js Architecture
description: Comprehensive operational guide for upgrading Next.js, React 19, and related dependencies across the Arch-System monorepo.
url: "https://nextjs.org/docs/app/getting-started/upgrading"
docs_index: /docs/llms.txt
version: 16.3.0
lastUpdated: 2026-08-05
prerequisites:
  - "Getting Started: /docs/app/getting-started"
related:
  - app/guides/upgrading/version-16
  - app/guides/upgrading/version-15
---

# Upgrading Next.js Architecture in Arch-System

This document specifies the upgrade procedures for Next.js, React 19, and monorepo workspace packages in **Arch-System**.

---

## 🚀 1. Monorepo Upgrade Commands

In **Arch-System**, package management is pinned to **pnpm 9** (`pnpm-lock.yaml`). Monorepo upgrades must be run using `pnpm` workspace commands to maintain lockfile deduplication.

### Upgrade to Latest Stable Release

To upgrade Next.js and core React 19 dependencies across `apps/portal` and workspace packages:

```bash
# Upgrade Next.js in portal app
pnpm --filter portal exec next upgrade

# Or update manually via pnpm across portal package
pnpm --filter portal add next@latest react@latest react-dom@latest
```

### Upgrade to Canary Release

To test Next.js canary features (e.g. `forbidden`, `unauthorized`, `authInterrupts`):

```bash
pnpm --filter portal add next@canary
```

---

## 🔒 2. Post-Upgrade Verification Checklist

After upgrading Next.js in `apps/portal`:

1. **Verify Bundled Agent Docs:**
   Next.js automatically updates the bundled documentation in `node_modules/next/dist/docs/`.
   Ensure `AGENTS.md` retains the managed block:
   ```md
   <!-- BEGIN:nextjs-agent-rules -->
   ...
   <!-- END:nextjs-agent-rules -->
   ```

2. **Run Full Monorepo Quality Gate (Cold Cache):**
   ```bash
   pnpm exec turbo run lint type-check test --force
   pnpm gates
   ```

3. **Validate Cache Components Compatibility:**
   Verify `cacheComponents: true` in `apps/portal/next.config.mjs` compiles without segment errors.

---

## 🔗 Related Documentation
- [Next.js AI Agent Setup](/docs/app/guides/ai-agents.md)
- [Enterprise Architecture Blueprint](/docs/architecture/enterprise-resiliency-blueprint.md)
- [Wayfinder Index](/docs/WAYFINDER.md)
