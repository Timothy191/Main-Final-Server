# Spec Workflow

## Phase order

1. **Requirements** — numbered, testable acceptance criteria
2. **Design** — architecture, files, boundaries, env (user sign-off)
3. **Tasks** — smallest testable units, ordered
4. **Execute** — one task at a time; `pnpm quality` before marking task complete

## Create flow

```bash
.qoder/skills/specs/scripts/create-spec.sh "My Feature Name"
```

Produces `.kiro/specs/<feature-slug>/{requirements,design,tasks}.md`

## Quality check

After implementation:

```bash
pnpm quality
```

Update `tasks.md` checkboxes only with evidence.

## Reference spec

`.kiro/specs/portal-migration/` — example of completed phases.
