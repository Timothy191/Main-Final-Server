# Quality Modes

## Full (default)

```bash
pnpm quality
```

Runs: `turbo run lint type-check test --concurrency=4 && pnpm format:check`

Use when: marking complete, pre-commit, multi-package changes, release.

## Portal

```bash
pnpm --filter portal lint
pnpm --filter portal type-check
pnpm --filter portal test
```

Use when: portal-only UI/logic change; scoped check is sufficient.

**Never** claim portal mode equals full `pnpm quality`.

## Notes

- ESLint `--max-warnings 0`
- tsc `noEmit` strict
- Jest `--passWithNoTests`
- Prettier on `**/*.{ts,tsx,md,json}`
