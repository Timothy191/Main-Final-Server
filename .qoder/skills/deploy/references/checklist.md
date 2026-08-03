# Pre-Deploy Checklist

Before deploying:

- [ ] `pnpm quality` passes (or scoped equivalent documented)
- [ ] `git status` clean (or user explicitly accepts dirty deploy)
- [ ] Environment variables in `.env` (not `.env.local` for container deploy)
- [ ] `docker info` succeeds (for `dev` environment)
- [ ] After migration changes: `pnpm audit:rls` passes

## dev environment

Runs `deploy-dev-mode.sh`:

- Builds portal with `output: "standalone"`
- Creates Docker image
- Runs container with env from `.env`

## local environment

Runs `pnpm dev` — full stack with Docker + portal.

## Security

Secrets injected at runtime; never baked into images.
