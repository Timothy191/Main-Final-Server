# When to use omp

## Wake

- Large refactor / deep multi-file coding
- Need omp’s IDE-wired tools beyond aider’s edit loop

## Do not use

- Spec-only OpenSpec work
- Brand / docs drift
- Tiny surgical edits → aider

## Headless flags

```
omp -p "$TASK" --no-session --approval-mode write
```

Optional: `--mode json` for machine-readable streams.
