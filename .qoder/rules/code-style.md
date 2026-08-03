---
description: TypeScript and component style rules for the Arch Systems monorepo
globs: ["**/*.ts", "**/*.tsx"]
---

# Code Style Rules

## TypeScript

- `strict: true` — no `any`, no `@ts-ignore`, no `@ts-expect-error` without a tracking ticket.
- Use `unknown` + type guards instead of `any`.
- Use `satisfies` to validate object literals without widening.
- Prefer `interface` for public API shapes, `type` for unions/intersections/utility types.
- Always type function return values explicitly for exported functions.
- Export types alongside implementations — co-locate, don't create separate `types/` files.

## Components

- Always define a named `interface <Component>Props` — no inline object types on function signatures.
- Page-level components: `<FeatureName>Page` (Server Component, default export).
- Client interactive: `<FeatureName>Form`, `<FeatureName>Modal`, `<FeatureName>Table`.
- Server data: `get<Resource>`, `list<Resource>`, `find<Resource>`.
- Server mutations: `create<Resource>Action`, `update<Resource>Action`, `delete<Resource>Action`.
- Memoize with `React.memo` only after profiling proves a render bottleneck.

## Styling

- Tailwind utility classes only — no inline `style={{}}` except for truly dynamic values.
- Use the `@repo/theme` Tailwind preset; do not override design tokens ad-hoc.
- **Light-only** macOS Ventura/Sonoma visual language (liquid glass). Dark mode is not supported — see `packages/theme/DECISIONS.md` #003 (dark wallpaper ≠ dark-mode UI). Reference: `apps/portal/src/app/(auth)/login/page.tsx`. Login control paints: theme `--login-*` (shell `--os-shell-*`); DECISIONS #010.
- Interactive states must include `focus-visible:ring` — never remove focus outlines.
- Use `cn()` from `@repo/utils` for conditional class merging.

## Formatting

- Prettier config: semi, double quotes, 2-space indent, trailing comma (es5), printWidth 100.
- A format-on-edit hook runs `prettier --write` automatically after every file edit.
