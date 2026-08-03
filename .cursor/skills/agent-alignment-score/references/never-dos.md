# AGENTS.md §18 Never-Dos (Hard Fail)

Any violation → Alignment Score = 0.

- npm/yarn instead of pnpm
- `"use client"` on layout files
- `fetch("/api/...")` from Server Components
- Service-role credentials in client bundle
- Skip Zod on user input
- `console.log` in production code (use `console.error`/`console.warn` with `[context]`)
- Hard-coded URLs, ports, or env-specific values
- New `packages/` entry without `pnpm-workspace.yaml` + `turbo.json` update
- Skip spec phases for multi-file changes
- Mark complete without `pnpm quality`

Source of truth: `AGENTS.md` §18.
