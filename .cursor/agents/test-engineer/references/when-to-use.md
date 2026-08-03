# When to use test-engineer

## Wake

- Flaky tests, missing coverage on critical paths, or CI test failures
- New Server Action, hook, or API route needs happy-path + validation tests
- E2E strategy (Playwright) for auth or core user journeys
- User says: tests are flaky, add tests, fix test suite, coverage gap
- After sceptic flags untested behavior

## Do not use

- Product UI implementation → `frontend-implementer`
- Security audit → `security`
- Docs/rules sync → `ai-docs-sync`
- Formal Alignment Score → `agent-alignment-score` skill

## Commands

```bash
pnpm --filter portal test -- --testPathPatterns="<area>"
pnpm quality   # full gate
# Flake hunt: jest --repeat-each=10 --testPathPatterns="<file>"
```
