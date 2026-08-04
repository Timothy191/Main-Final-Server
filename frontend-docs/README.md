# Frontend Documentation

This directory contains the canonical reference for the Arch System frontend layer:
how the UI kit, theme system, and portal components are organized, what standards
they follow, and how to extend them safely.

## Contents

| Document                                       | Purpose                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| [UI_KIT_AUDIT.md](./UI_KIT_AUDIT.md)           | Current state of `@repo/ui`, gaps, and risks.                        |
| [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md) | Complete catalog of shared and local components.                     |
| [THEME_SYSTEM.md](./THEME_SYSTEM.md)           | Tokens, CSS, Tailwind preset, and glass rules.                       |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)     | Adopting shadcn/ui primitives without breaking the design system.    |
| [BEST_PRACTICES.md](./BEST_PRACTICES.md)       | Rules, verification steps, and coding conventions for frontend work. |

## Where to start

- **Adding a new shared primitive?** Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) and [BEST_PRACTICES.md](./BEST_PRACTICES.md).
- **Changing a color, radius, or glass value?** Read [THEME_SYSTEM.md](./THEME_SYSTEM.md) and run `pnpm --filter @repo/theme lint:tokens`.
- **Building a new feature page?** Read [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md) to reuse existing components, then [BEST_PRACTICES.md](./BEST_PRACTICES.md) for the quality gates.
- **Evaluating whether to bring in shadcn/ui?** Read [UI_KIT_AUDIT.md](./UI_KIT_AUDIT.md) first, then [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

## Status

These docs were generated from the actual code in `apps/portal`, `packages/ui`, and
`packages/theme` on 2026-08-04. They should be updated whenever the corresponding
system changes — stale docs are treated as a bug, just like stale tests.
