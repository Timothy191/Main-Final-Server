# Limitations

1. Patterns use `fetch` directly. React Query, SWR, or tRPC are fine — same cancellation/dedup/backoff rules apply.
2. Do not retry non-idempotent mutations without idempotency keys.
3. Never expose privileged API keys in client code.

## External resources

- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [React useEffect](https://react.dev/reference/react/useEffect)
