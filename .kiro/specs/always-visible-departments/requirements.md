# Always-Visible Departments

## Intent

All department modules remain permanently visible in the hub (and related nav). Authorization still gates entry. Unauthorized departments show a no-entry cursor and do not navigate. User `timothyoniel558@gmail.com` must have permanent access to every department.

## Acceptance Criteria

1. Hub department grid always lists every entry in `DEPARTMENTS` (never hide by ACL).
2. A department the employee cannot open shows `cursor: not-allowed` (no-entry) and does not navigate on click/keyboard.
3. Authorized departments keep normal pointer and navigate as today.
4. Bottom nav department items stay visible; unauthorized items use no-entry cursor and do not navigate.
5. Employee linked to `timothyoniel558@gmail.com` has `role = admin` and `accessible_departments` containing every department UUID (seed/migration idempotent).
6. Proxy/route ACL continues to deny unauthorized deep links (hub UX does not weaken server gates).
