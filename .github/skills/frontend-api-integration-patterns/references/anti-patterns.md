# Anti-Patterns

| Anti-pattern                    | Why                          | Fix                                  |
| ------------------------------- | ---------------------------- | ------------------------------------ |
| Retrying 4xx                    | Won't succeed                | `fetchWithBackoff` — 5xx only        |
| No cancellation                 | Memory leaks, stale state    | `controller.abort()` in cleanup      |
| Race updates                    | Old response wins            | Cancellation flag or AbortController |
| Silent `catch {}`               | Undetected failures          | Log + user message                   |
| Global loading for N requests   | One fail breaks all          | Per-request state                    |
| `any` / raw `err.message` in UI | Type safety + leak internals | Typed errors + safe copy             |

Never expose service-role keys in frontend. Proxy sensitive calls through server actions or API.
