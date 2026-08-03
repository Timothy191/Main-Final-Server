# Outlining Automated Audit Reporter Feature

## Intent

Provide automated daily cross-department compliance reporting at 08:00 AM by aggregating operational data, generating PDF digests, distributing alerts via Novu, and showing status on a safety dashboard.

## Critical coverage (must not miss)

| Aspect                      | Status            | Evidence / gap |
| --------------------------- | ----------------- | -------------- |
| Spec phases                 | needed            | Drafted in `openspec/automated-audit-reporter.md` |
| Stack / boundaries          | ok                | Job runs inside `apps/portal`; shared db logic in `@repo/supabase` |
| Security (Zod/auth/secrets) | ok                | Uses `createServiceRoleClient()` for backend access; Zod schema for validation |
| Files likely touched        | ok                | See outline list below |
| Verify plan                 | needed            | Integration test suite for PDF rendering and database aggregation |

### Files likely touched
- [apps/portal/src/app/api/inngest/route.ts](file:///home/timothy/Projects/apps/portal/src/app/api/inngest/route.ts) — Register new Inngest handler.
- `apps/portal/src/lib/jobs/automated-audit.ts` *(new)* — Scheduled Cron function for 08:00 AM.
- `apps/portal/src/lib/reports/audit-aggregator.ts` *(new)* — Multi-DB aggregation logic (access-control, drilling, production).
- `apps/portal/src/lib/reports/templates/AuditReportDocument.tsx` *(new)* — `@react-pdf/renderer` template matching `CardDocument` patterns.
- `apps/portal/src/app/(departments)/safety/audit-dashboard/page.tsx` *(new)* — Dashboard UI for viewing daily status.

## Outline (ordered)

1. **Database Schema & Aggregation Logic**:
   - Create SQL queries / Supabase service wrappers to pull status counters from `access_control`, `drilling_logs`, and `production_runs` for the previous 24 hours.
   - Implement `apps/portal/src/lib/reports/audit-aggregator.ts` to execute queries in parallel and format aggregate metrics.

2. **PDF Template Design**:
   - Design `AuditReportDocument` in `apps/portal/src/lib/reports/templates/AuditReportDocument.tsx` using `@react-pdf/renderer` components (`Document`, `Page`, `Text`, `View`, `StyleSheet`).

3. **Inngest Cron Job & Novu Integration**:
   - Create `apps/portal/src/lib/jobs/automated-audit.ts` configured with `triggers: [{ cron: "0 8 * * *" }]`.
   - Implement step-by-step:
     1. Aggregate statistics.
     2. Render PDF to temp folder using `renderToFile`.
     3. Upload PDF to Supabase Storage bucket (`audit-reports`).
     4. Call Novu client API using `NOVU_API_KEY` to trigger report email workflow.
   - Register function in `apps/portal/src/app/api/inngest/route.ts`.

4. **Dashboard Interface**:
   - Create a modern light-mode dashboard page at `/safety/audit-dashboard` to display execution logs, download buttons for generated PDFs, and alert statuses.

## Handoffs

| Step | Owner agent | Input needed | Done-when |
| ---- | ----------- | ------------ | --------- |
| 1. DB & Aggregator | `backend-architect` | DB structure of access control, drilling, and production tables | `audit-aggregator.ts` unit tests pass |
| 2. PDF Template | `frontend-design` | Branding guidelines & typography | PDF renders locally matching Plantcor design spec |
| 3. Inngest Job & Novu | `backend-architect` | Novu API keys & template IDs | Scheduled job triggers and registers in Inngest console |
| 4. Dashboard UI | `frontend-implementer` | Mock aggregated report state | Dashboard lists reports with download and status filters |
| 5. Testing | `test-engineer` | Stubbed Novu/Supabase clients | Full integration tests run successfully and green |

## Parallel / idle opportunities

- While `backend-architect` builds DB aggregator, `frontend-design` can work in parallel on the PDF rendering layout.
- Dashboard mock UI development can happen before the actual Inngest endpoint is fully integrated.

## Open questions / assumptions

- **Supabase Storage Bucket**: Do we need to create a new `audit-reports` bucket, or is there an existing operational bucket we should reuse?
- **Novu Delivery Channels**: Is email the only distribution channel, or do we also require SMS or browser push notifications?
- **Retention Policy**: Should generated PDFs remain indefinitely in storage, or do we implement a cleanup cron (e.g., keep for 30 days)?

Next owner: `backend-architect` — Implement the DB aggregator and mock data resolver.
