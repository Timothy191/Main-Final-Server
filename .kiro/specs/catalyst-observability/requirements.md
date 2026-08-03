# Requirements: Catalyst observability (manual)

## Intent

Wire Inference.net Catalyst **gateway** + **tracing** into the portal AI path after `inf instrument` failed (Claude Code not logged in).

## Acceptance

1. When `INFERENCE_GATEWAY_ENABLED=true` and `INFERENCE_API_KEY` set, external LLM HTTP calls (Gemini; Ollama cloud) route via `https://api.inference.net` with required headers + `x-inference-task-id=arch-portal`.
2. Local Ollama (`localhost`) is **not** proxied.
3. Router/omni shell strategies unchanged (still `pnpm provider:route`).
4. `@inference/tracing` `setup()` runs from portal `instrumentation.ts` when `CATALYST_OTLP_TOKEN` is set; `invokeAiChat` wrapped in `agentSpan` when available.
5. Secrets only in `.env.local` / runtime env — documented in `.env.example`, never committed.
6. Existing tests pass; new unit tests for gateway helper enablement.
7. `pnpm --filter portal type-check` clean.

## Out of scope

- Replacing provider-router shell with gateway for every free-tier provider
- Migrating to `@inference/sdk`
- Spawning Claude Code via `inf instrument`
