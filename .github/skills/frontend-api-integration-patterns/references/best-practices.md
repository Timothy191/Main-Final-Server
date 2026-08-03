# Best Practices

| #   | Practice                       | Rationale                                   |
| --- | ------------------------------ | ------------------------------------------- |
| 1   | Centralize API logic           | Single source for headers, errors, base URL |
| 2   | Use `@repo/errors` hierarchy   | Consistent error shape                      |
| 3   | Handle loading, error, success | Every fetch has visible UI state            |
| 4   | `AbortController` on unmount   | Prevents leaks and stale updates            |
| 5   | Retry only 5xx + network       | 4xx won't fix on retry                      |
| 6   | Debounce input-driven APIs     | Less load, less jank                        |
| 7   | Deduplicate identical requests | Avoid N-in-flight on mount                  |

## Common pitfalls

| Problem            | Cause           | Fix                          |
| ------------------ | --------------- | ---------------------------- |
| Stale data         | No cancellation | AbortController in cleanup   |
| Too many calls     | No debounce     | `useDebounce` before fetch   |
| Duplicate requests | No dedup        | `dedupedFetch` with URL key  |
| Retry storms       | Fixed delay     | Exponential backoff + jitter |
