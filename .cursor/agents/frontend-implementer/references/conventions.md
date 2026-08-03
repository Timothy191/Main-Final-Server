# Frontend Implementer — Conventions

Canonical: `AGENTS.md` §3–4, §18.

## Layout

`apps/portal/src/{app,components,features}/` — feature modules with `_actions/`, `_data/`

## Naming

`<Feature>Page`, `<Feature>Form`, `get|list|find<Resource>`, `create|update|delete<Resource>Action`, `interface Props`, `metadata` on pages, `loading.tsx` / `error.tsx`

## Boundaries

Server default; no `"use client"` on layouts; no server-only imports in client; no `fetch("/api/...")` from RSC; Server Actions use Zod + `{ data } | { error }`

## Styling & a11y

`@repo/theme`, login SSOT, focus rings, semantic HTML, WCAG 2.1 AA, `next/image`, `next/font`

## Multi-file

`.kiro/specs/<slug>/` before large implementation
