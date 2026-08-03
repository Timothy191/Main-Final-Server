# Design: Catalyst observability

## Architecture

| Layer | Mechanism |
|---|---|
| Gateway | `apps/portal/src/lib/ai/catalyst-gateway.ts` builds proxy URL + headers |
| Call sites | `gateway.ts` Gemini + `ollama-client.ts` cloud only |
| Tracing | `@inference/tracing` in `instrumentation.ts`; `agentSpan` around `invokeAiChat` |
| Env | Zod in `src/lib/env.ts`; examples in `.env.example` |

## Enablement

- Gateway off unless `INFERENCE_GATEWAY_ENABLED=true` **and** `INFERENCE_API_KEY` present.
- Tracing off unless `CATALYST_OTLP_TOKEN` present (usually same as Inference API key).

## OTel note

Portal already uses `@vercel/otel`. Catalyst registers its own exporter when enabled. Prefer both; if span export conflicts, gateway metrics still land in Catalyst Overview.
