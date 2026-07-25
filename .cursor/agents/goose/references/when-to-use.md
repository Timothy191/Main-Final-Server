# When to use goose

## Wake

- Recipes, MCP extensions, multi-tool automation
- `goose run -t "..."` one-shots
- Research → act workflows

## Do not use

- Tiny single-file edit → aider
- OpenSpec validate-only → openspec
- Branded UI / formal score

## Headless flags

```
GOOSE_MODE=auto goose run -t "$TASK" --no-session -q
```

Wrapper exports `GOOSE_MODE=auto` by default so headless does not hang on tool confirmation.
