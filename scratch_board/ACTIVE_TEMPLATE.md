---
agent: <slug>
session: <hex>
started: <ISO-8601 local>
expected_duration_min: 15
status: active
owner_scope:
  - <path or glob>
must_not_touch:
  - <path or glob>
depends_on: []
---

# <agent> — <one-line mission>

## Files being written / edited

- `<path>` — <create | edit | delete>

## Files being read (read-only)

- `<path>`

## Commands run

- `<command>` — <intent>

## Notes

<free-form context that another agent would need to avoid stepping on this work>
