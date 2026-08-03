# Portal Page Routes Map

## 1. Overview

The **Arch Systems Portal** (`apps/portal`, Next.js 16 App Router) exposes **69 `page.tsx` page routes** under `apps/portal/src/app/`. This map indexes every page route (UI surface), grouped by area. API route handlers are documented separately in [`api-routes.md`](./api-routes.md).

### Route-group conventions

- `(name)` — route group: organizes files but is **not** part of the URL (e.g. `(auth)`, `(departments)`).
- `[param]` — dynamic segment. `[...catchAll]` — catch-all.
- `@name` — parallel route (intercepting routes / modals); not navigable directly.

The root `/` redirects to `/login` (`apps/portal/src/app/page.tsx`).

---

## 2. Auth & Top-Level (5 routes)

| URL                | File                                  | Notes                            |
| :----------------- | :------------------------------------ | :------------------------------- |
| `/`                | `app/page.tsx`                        | Redirects to `/login`.           |
| `/login`           | `app/(auth)/login/page.tsx`           | Primary landing / login.         |
| `/reset-password`  | `app/(auth)/reset-password/page.tsx`  | Password reset request.          |
| `/update-password` | `app/(auth)/update-password/page.tsx` | Password update flow.            |
| `/auth/callback`   | `app/auth/callback/page.tsx`          | Auth provider redirect callback. |

## 3. Hub & Admin (4 routes)

| URL                | File                           | Notes                         |
| :----------------- | :----------------------------- | :---------------------------- |
| `/hub`             | `app/hub/page.tsx`             | Main authenticated dashboard. |
| `/admin`           | `app/admin/page.tsx`           | Admin landing.                |
| `/admin/personnel` | `app/admin/personnel/page.tsx` | Personnel management.         |
| `/admin/shifts`    | `app/admin/shifts/page.tsx`    | Shift management.             |

## 4. Department Pages (56 routes)

All departments live under the `(departments)` route group (no URL prefix). `[department]` is the fallback dynamic route for any department slug without a dedicated subtree.

### Dynamic fallback (1 route)

| URL             | File                                      | Notes                                         |
| :-------------- | :---------------------------------------- | :-------------------------------------------- |
| `/[department]` | `app/(departments)/[department]/page.tsx` | Generic department router for unmapped slugs. |

### Access Card Actions (5 routes)

| URL                                 | File                                                          |
| :---------------------------------- | :------------------------------------------------------------ |
| `/access-card-actions`              | `app/(departments)/access-card-actions/page.tsx`              |
| `/access-card-actions/card-actions` | `app/(departments)/access-card-actions/card-actions/page.tsx` |
| `/access-card-actions/print-cards`  | `app/(departments)/access-card-actions/print-cards/page.tsx`  |
| `/access-card-actions/qr-codes`     | `app/(departments)/access-card-actions/qr-codes/page.tsx`     |
| `/access-card-actions/reports`      | `app/(departments)/access-card-actions/reports/page.tsx`      |

### Access Control (5 routes)

| URL                           | File                                                    |
| :---------------------------- | :------------------------------------------------------ |
| `/access-control`             | `app/(departments)/access-control/page.tsx`             |
| `/access-control/access-logs` | `app/(departments)/access-control/access-logs/page.tsx` |
| `/access-control/badges`      | `app/(departments)/access-control/badges/page.tsx`      |
| `/access-control/reports`     | `app/(departments)/access-control/reports/page.tsx`     |
| `/access-control/visitors`    | `app/(departments)/access-control/visitors/page.tsx`    |

### Control Room (6 routes)

| URL                                | File                                                         |
| :--------------------------------- | :----------------------------------------------------------- |
| `/control-room`                    | `app/(departments)/control-room/page.tsx`                    |
| `/control-room/engineering-notes`  | `app/(departments)/control-room/engineering-notes/page.tsx`  |
| `/control-room/excavator-activity` | `app/(departments)/control-room/excavator-activity/page.tsx` |
| `/control-room/hourly-loads`       | `app/(departments)/control-room/hourly-loads/page.tsx`       |
| `/control-room/machine-operations` | `app/(departments)/control-room/machine-operations/page.tsx` |
| `/control-room/reports`            | `app/(departments)/control-room/reports/page.tsx`            |

### Drilling (4 routes)

| URL                             | File                                                      |
| :------------------------------ | :-------------------------------------------------------- |
| `/drilling`                     | `app/(departments)/drilling/page.tsx`                     |
| `/drilling/drilling-operations` | `app/(departments)/drilling/drilling-operations/page.tsx` |
| `/drilling/machine-telemetry`   | `app/(departments)/drilling/machine-telemetry/page.tsx`   |
| `/drilling/reports`             | `app/(departments)/drilling/reports/page.tsx`             |

### Engineering (8 routes)

| URL                            | File                                                     |
| :----------------------------- | :------------------------------------------------------- |
| `/engineering`                 | `app/(departments)/engineering/page.tsx`                 |
| `/engineering/breakdowns`      | `app/(departments)/engineering/breakdowns/page.tsx`      |
| `/engineering/daily-log`       | `app/(departments)/engineering/daily-log/page.tsx`       |
| `/engineering/history`         | `app/(departments)/engineering/history/page.tsx`         |
| `/engineering/machines`        | `app/(departments)/engineering/machines/page.tsx`        |
| `/engineering/reports`         | `app/(departments)/engineering/reports/page.tsx`         |
| `/engineering/tire-management` | `app/(departments)/engineering/tire-management/page.tsx` |
| `/engineering/tools`           | `app/(departments)/engineering/tools/page.tsx`           |

### Production (6 routes)

| URL                     | File                                              |
| :---------------------- | :------------------------------------------------ |
| `/production`           | `app/(departments)/production/page.tsx`           |
| `/production/daily-log` | `app/(departments)/production/daily-log/page.tsx` |
| `/production/history`   | `app/(departments)/production/history/page.tsx`   |
| `/production/machines`  | `app/(departments)/production/machines/page.tsx`  |
| `/production/reports`   | `app/(departments)/production/reports/page.tsx`   |
| `/production/tools`     | `app/(departments)/production/tools/page.tsx`     |

### Safety (7 routes)

| URL                       | File                                                |
| :------------------------ | :-------------------------------------------------- |
| `/safety`                 | `app/(departments)/safety/page.tsx`                 |
| `/safety/audit-dashboard` | `app/(departments)/safety/audit-dashboard/page.tsx` |
| `/safety/daily-log`       | `app/(departments)/safety/daily-log/page.tsx`       |
| `/safety/history`         | `app/(departments)/safety/history/page.tsx`         |
| `/safety/machines`        | `app/(departments)/safety/machines/page.tsx`        |
| `/safety/reports`         | `app/(departments)/safety/reports/page.tsx`         |
| `/safety/tools`           | `app/(departments)/safety/tools/page.tsx`           |

### Satellite Monitoring (4 routes)

| URL                                   | File                                                            |
| :------------------------------------ | :-------------------------------------------------------------- |
| `/satellite-monitoring`               | `app/(departments)/satellite-monitoring/page.tsx`               |
| `/satellite-monitoring/highres`       | `app/(departments)/satellite-monitoring/highres/page.tsx`       |
| `/satellite-monitoring/hyperspectral` | `app/(departments)/satellite-monitoring/hyperspectral/page.tsx` |
| `/satellite-monitoring/sar`           | `app/(departments)/satellite-monitoring/sar/page.tsx`           |

### Training (5 routes)

| URL                        | File                                                 |
| :------------------------- | :--------------------------------------------------- |
| `/training`                | `app/(departments)/training/page.tsx`                |
| `/training/certifications` | `app/(departments)/training/certifications/page.tsx` |
| `/training/courses`        | `app/(departments)/training/courses/page.tsx`        |
| `/training/reports`        | `app/(departments)/training/reports/page.tsx`        |
| `/training/schedules`      | `app/(departments)/training/schedules/page.tsx`      |

## 5. Docs, Quickview, Misc (6 routes)

| URL                | File                           | Notes                            |
| :----------------- | :----------------------------- | :------------------------------- |
| `/docs/api`        | `app/docs/api/page.tsx`        | API docs.                        |
| `/docs/components` | `app/docs/components/page.tsx` | Component docs.                  |
| `/docs/crp`        | `app/docs/crp/page.tsx`        | CRP docs.                        |
| `/offline`         | `app/offline/page.tsx`         | Offline fallback page.           |
| `/privacy`         | `app/privacy/page.tsx`         | Privacy policy.                  |
| `/quickview/[id]`  | `app/quickview/[id]/page.tsx`  | Quickview detail (dynamic `id`). |

## 6. Parallel / Intercepting Modal Routes (3 routes)

These live under the `@modal` parallel route and are not directly navigable; they intercept matching routes to render modal UI.

| URL pattern                | File                                    | Behavior                               |
| :------------------------- | :-------------------------------------- | :------------------------------------- |
| `@modal` (default)         | `app/@modal/page.tsx`                   | Default modal slot.                    |
| `@modal/(.)quickview/[id]` | `app/@modal/(.)quickview/[id]/page.tsx` | Intercepts `/quickview/[id]` as modal. |
| `@modal/[...catchAll]`     | `app/@modal/[...catchAll]/page.tsx`     | Catch-all modal fallback.              |

---

## 7. Summary Counts

| Area                  | Routes |
| :-------------------- | :----- |
| Auth & top-level      | 5      |
| Hub & Admin           | 4      |
| Department dynamic    | 1      |
| Access Card Actions   | 5      |
| Access Control        | 5      |
| Control Room          | 6      |
| Drilling              | 4      |
| Engineering           | 8      |
| Production            | 6      |
| Safety                | 7      |
| Satellite Monitoring  | 4      |
| Training              | 5      |
| Docs, Quickview, Misc | 6      |
| Parallel modal        | 3      |
| **Total**             | **69** |

> Generated from `find apps/portal/src/app -name page.tsx`. Regenerate after adding/removing routes.
