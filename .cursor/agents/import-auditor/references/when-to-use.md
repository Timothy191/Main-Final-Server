# When to use import-auditor

## Wake

- After file **move**, **rename**, or **delete**
- After refactor touching `import` / `export` / `tsconfig` paths / `package.json` exports
- User asks: audit imports, check paths, broken module, wrong import, path connectivity
- Chained from `root-cause-healer` or `patch-builder` after code changes
- Before claiming done on multi-package refactors (e.g. NestJS → Next.js API routes)

## Do not use

- Runtime-only bugs with no import/path signal — `gap-analyst`
- Security/RLS review — `security`
- AI docs drift — `ai-docs-sync`
- Implementing the fix — `patch-builder` (this agent is read-only audit)

## Scope defaults

| Trigger                 | Scope                               |
| ----------------------- | ----------------------------------- |
| Single PR / agent patch | `git diff --name-only` + dependents |
| User says "full audit"  | entire monorepo                     |
| New package added       | package + all consumers             |
