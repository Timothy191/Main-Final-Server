---
name: deploy
description: >-
  Deploy the portal to dev or local environment. User-invoked only.
  Anti-trigger: do not auto-invoke; do not skip pre-deploy checklist; do not
  replace quality skill or RLS audit for migration changes.
disable-model-invocation: true
---

# Deploy Portal

**User-invoked only.** Wait for explicit `/deploy <environment>`.

## Usage

```
/deploy dev    # Docker standalone build
/deploy local  # Same as pnpm dev
```

## Workflow

1. Run pre-deploy checklist — [`references/checklist.md`](references/checklist.md)
2. Deploy via script for target environment
3. Report result with evidence (container status, URL, logs)

## Scripts

| Environment | Script                    |
| ----------- | ------------------------- |
| `dev`       | `scripts/deploy-dev.sh`   |
| `local`     | `scripts/deploy-local.sh` |

## References

- [`references/checklist.md`](references/checklist.md) — gates before deploy
