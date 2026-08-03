# Arch-Systems (Plantcor)

[![CI](https://github.com/Timothy191/Arch-Mk2/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/Timothy191/Arch-Mk2/actions/workflows/quality-gate.yml)
[![Tests](https://github.com/Timothy191/Arch-Mk2/actions/workflows/api-build-test.yml/badge.svg)](https://github.com/Timothy191/Arch-Mk2/actions/workflows/api-build-test.yml)

Industrial mining-operations portal — a pnpm + Nx monorepo.

## Apps

| App             | Port   | Description                 |
| --------------- | ------ | --------------------------- |
| `apps/portal`   | `3000` | Operations dashboard (main) |
| `apps/cms`      | `3001` | Payload CMS v3              |
| `apps/overview` | `3002` | Architecture/flow viewer    |

## Packages

| Package                                                                         | Purpose                                             |
| ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `@repo/supabase`                                                                | Data access layer (server/client, Kysely, typed DB) |
| `@repo/database`                                                                | SQL migrations source of truth                      |
| `@repo/theme`                                                                   | Design tokens + Tailwind preset                     |
| `@repo/ui`                                                                      | shadcn-style primitives                             |
| `@repo/redis`                                                                   | Caching                                             |
| `@repo/rate-limiter`                                                            | Rate limiting                                       |
| `@repo/eval`                                                                    | Python LLM eval suite                               |
| `@repo/errors`, `@repo/utils`, `@repo/eslint-config`, `@repo/typescript-config` | Shared support                                      |

## Prerequisites

- Node.js >= 22 (Volta pins 24.15.0)
- pnpm 9.15.9
- Docker (for Supabase local dev)

## Quick start

```bash
git clone https://github.com/Timothy191/Arch-Mk2.git
cd Arch-Mk2
pnpm install
pnpm dev          # Supabase + Portal + health checks + browser
```

The portal is available at [http://localhost:3000](http://localhost:3000).

## Common commands

```bash
pnpm dev              # Supabase + Portal + health checks + browser
pnpm dev --quick      # Portal only, no Docker
pnpm quality          # lint + type-check + test + token/css lint + format + syncpack + knip
pnpm build            # Build everything
pnpm test             # Unit tests
pnpm test:e2e         # E2E (requires pnpm dev running)
pnpm format           # Format all files
```

## Multi-Device Workflow (HP Zbook & Work-remote-server)

To work seamlessly between your two machines, pull latest before starting and push before stopping:

```bash
# Start of session
git checkout main && git pull origin main && pnpm install

# End of session
git add . && git commit -m "feat: your message" && git push origin main
```

## License

MIT

# asd
