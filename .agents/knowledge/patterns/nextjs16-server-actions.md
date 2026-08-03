---
title: Next.js 16 Server Actions & Turbopack Client Bundling Gotcha
tags: [patterns, nextjs16, server-actions, turbopack, client-components]
updated: 2026-07-22
source_agent: antigravity
status: active
---

# Next.js 16 Server Actions & Turbopack Client Bundling Gotcha

## Problem
In Next.js 16 (App Router) with Turbopack, if a Client Component (`'use client'`) imports a Server Action (`'use server'`) from a file that also imports heavy server-only packages (e.g. `@react-pdf/renderer`, `@repo/utils/inngest`), Turbopack tries to analyze and bundle that module tree for the client. This results in compile-time or runtime errors such as:
`"Module [...] was instantiated because it was required from [...], but the module factory is not available."`

## Solution
Isolate Server Actions that are imported by Client Components into lightweight, dedicated files:
1. **Move Client-Imported Actions**: E.g., move `logout` to `logout-action.ts`. Keep this file extremely minimal, importing only basic utils like `@repo/supabase/server` or `next/navigation`.
2. **Leave Server-Only Actions**: Keep actions that use heavy backend libraries (PDF generation, queue triggers) in `actions.ts`. These actions should only be called from Server Components or route handlers where they won't pollute the client bundling path.

## Evidence & Citation
Resolved in `apps/portal/src/components/nav/ServicesDropdown.tsx` during the refactoring of the `logout` action in `apps/portal/src/app/logout-action.ts` to clear a Turbopack compilation block.
