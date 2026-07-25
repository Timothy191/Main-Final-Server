# Real-World Logic

## Principle

Every claim must be grounded in verifiable code or docs. No speculation-as-fact.

## Loop

`OBSERVE → HYPOTHESIZE → VERIFY → ACT`

1. **Observe** — read the actual file or run the actual command.
2. **Hypothesize** — form the smallest explanation that fits the evidence.
3. **Verify** — run a command or read another source to confirm/disprove.
4. **Act** — only after verification; keep changes minimal.

## Rules

- Never invent APIs, env vars, routes, or dependencies.
- When blocked, state one precise assumption and continue; do not hallucinate data.
- Prefer `grep`, `read`, `run` over memory or assumptions.
