# Design system — Module C (existing app)

Authority: existing portal patterns > user overrides > greenfield skill defaults.

## Detected signals (defer to these)

| Signal               | Source                                           |
| -------------------- | ------------------------------------------------ |
| Tailwind + tokens    | `@repo/theme` / `apps/portal/tailwind.config.ts` |
| Theme provider       | `ArchThemeProvider` in root layout               |
| Light-only           | AGENTS / DECISIONS #003 — no dark-mode invent    |
| Shell / login chrome | `--os-shell-*`, `--login-*` CSS variables        |
| UI primitives        | `@repo/ui` before new Radix                      |
| Icons / toasts       | lucide-react, sonner only                        |

## Visual thesis (extend, don't reinvent)

Industrial ops portal: calm light surfaces, clear hierarchy, utility copy — not marketing SaaS purple gradients.

## Content plan (app features)

Primary workspace → status/orientation → actions. Headings name the area ("Plan status"), not slogans.

## Interaction plan

1. Clear state transitions (default → loading → error → success) on forms/actions
2. Visible focus rings on all interactive controls
3. Optional: one subtle entrance for new panels — CSS only unless Motion already in the feature

## Hard avoids

- Purple-on-white / cream-serif-terracotta AI defaults
- Card chrome when plain layout works
- Hero overlays, pill clusters, stat strips on product screens
- Prompt language in UI copy
- New font stacks / design systems inside a feature

## When to escalate

| Need                     | Agent               |
| ------------------------ | ------------------- |
| Brand-first landing/hero | `frontend-design`   |
| Vercel partner marks     | `vercel-brand-sync` |
| Threat model / RLS audit | `security`          |
