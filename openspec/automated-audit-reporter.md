# OpenSpec: Automated Audit Reporter

## Goal
Automate the generation and distribution of daily department audit reports to improve compliance oversight and reduce manual overhead.

## Requirements
- Automated daily report generation at 08:00 AM (Inngest).
- Data aggregation from `access-control`, `drilling`, and `production` databases.
- PDF report generation using existing `CardDocument` infrastructure.
- Email/Notification distribution via Novu.
- Audit status dashboard for oversight.

## Deliverables
- Inngest function for scheduled trigger.
- Data aggregation service in `lib/reports`.
- Notification workflow setup.
- Integration test for report generation path.

## Constraints
- Must follow monorepo boundary rules (`apps/portal` vs `packages/`).
- Must leverage `@repo/errors` for reporting failures.
