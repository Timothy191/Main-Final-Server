# AI Agent Context Index

This directory contains AI-agent operational documentation, physically separate from monorepo source code.

## Files

| File           | Purpose                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `README.md`    | This index file                                                             |
| `../SOUL.md`   | Real-world thought process contract for all agents                          |
| `../AGENTS.md` | Root agent registry with roles, orchestration rules, and skill requirements |
| `skills/`      | Individual skill definitions for agent capabilities                         |

## Agent Registry

Six agent roles are defined in `../AGENTS.md`:

- `fullstack-nextjs-pro` — Next.js 16, RSC, Server Actions, NestJS API, Supabase
- `backend-nestjs-pro` — NestJS 11/Fastify, Zod, global filters
- `frontend-ui-pro` — React 19, `@repo/ui`, Tailwind, WCAG, testing
- `devops-ci-pro` — Turborepo, pnpm, Docker, GitHub Actions
- `architect-pro` — Module boundaries, ADRs, migration strategy
- `security-pro` — Supabase auth/RLS, rate limiting, secrets

## Skill Discovery

All agents MUST consult `using-agent-skills` (defined in user-scope skills) to discover and invoke available skills before taking action.
