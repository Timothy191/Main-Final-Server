# When to use aider

## Wake

- Bounded edit with known files
- One-shot “fix X in Y.ts”
- Pair-program style surgical change

## Do not use

- Open research / MCP recipes → goose
- Large unstructured refactor → omp
- Spec-only / OpenSpec validate → openspec

## Headless flags

```
aider --message "$TASK" --yes-always --no-stream --no-pretty --no-check-update --no-auto-commits [files...]
```

Requires API key / model env already configured for the user.
