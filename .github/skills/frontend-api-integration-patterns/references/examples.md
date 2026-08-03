# Examples

## ML prediction with cancellation

Use `useRef<AbortController>` when predict is user-triggered (not effect-driven).

## Debounced search

Combine `useDebounce(query, 400)` with `AbortController` in effect cleanup.

## Optimistic UI delete

Snapshot state before optimistic update; rollback on failure with user-facing message.

See full implementations in git history of this skill's monolithic `SKILL.md` or apply patterns from `core-patterns.md` to your feature hook.
