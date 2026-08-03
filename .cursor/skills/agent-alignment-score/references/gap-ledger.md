# Gap ledger — closing Alignment scores below 100

Companion to [`rubric.md`](rubric.md). The /100 total uses fixed dimension weights; this ledger explains common shortfalls and how to close them.

## Example: CLI agents wiring (86/100)

| Dim        | Score | Gap | Root cause                                                                                   | Close action                                                            |
| ---------- | ----: | --: | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Spec       | 12/20 |  −8 | Multi-file AI work without `.kiro/specs/<slug>/`                                             | Add requirements/design/tasks before or with the change                 |
| Stack      | 15/15 |   0 | —                                                                                            | —                                                                       |
| Boundaries | 14/15 |  −1 | Mirror/path friction (Claude entry vs `.cursor` collateral)                                  | Invoke scripts from repo root; keep inventories synced                  |
| Security   | 16/20 |  −4 | Powerful headless modes (`GOOSE_MODE=auto`, omp write); paid smoke may hit `API_KEY_INVALID` | Document threat; allowlist modes; valid keys required for live smoke    |
| Quality    | 15/15 |   0 | `pnpm ai check` / scoped quality PASS                                                        | Product code still needs full `pnpm quality`                            |
| Verify     | 14/15 |  −1 | Dry-run ladder OK; paid one-shot blocked on bad provider auth                                | Re-run tier-4 smoke after fixing keys; do not treat auth stderr as pass |

## Permanent close rules

1. **Multi-file → specs first** — Spec 20/20 only with `.kiro/specs/<slug>/` (or true single-file N/A).
2. **Verify with observed commands** — no “should work”.
3. **Security** — Zod/secrets for product; for CLI agents, document approval modes and fail-closed timeouts.
4. **After scoring** — emit Recommended actions (3) + Adaptive next; run `skill-self-improve` when pattern repeats.

## Related

- Extended output: [`gold-contract.md`](gold-contract.md)
- Pro bar / tokens: [`extended-metrics.md`](extended-metrics.md)
- Hermes distill: `.cursor/skills/skill-self-improve/`
