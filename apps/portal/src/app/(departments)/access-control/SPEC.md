# Arch System — Department Specification: Access Control

## 1. Overview

- **Department Slug:** `access-control`
- **Department Name:** Access Control
- **Icon:** `ShieldCheck`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Site security, gate access logging, visitor management, and physical badge verification.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** **RESTRICTED ROUTE.** Listed in `RESTRICTED_DEPT_ROLES['access-control'] = ['access_control', 'admin']`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` evaluates `isRestrictedRouteAllowed('/access-control', ...)` and blocks any user lacking `access_control` or `admin` role.
- **Server Action Protection:** Server actions in `actions.ts` enforce `assertDeptRole(['admin', 'access_control'], 'access-control')`.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-access-control: #0284c7` (`packages/theme/src/css/variables.css:116`)
- **Color Alias:** `blue`
- **Tailwind Safe-List:**
  - `dept-access-control`
  - `bg-dept-access-control`
  - `text-dept-access-control`
  - `border-dept-access-control`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/access-control`):** Real-time personnel count on site, active visitor count, badge status distribution (`DashboardKPIGrid`, `DashboardEntityStatus`).
- **Access Logs (`/access-control/access-logs`):** Gate entry/exit event logs with hourly traffic distribution (`HourlyAccessChart`, `DashboardActivityFeed`).
- **Visitors (`/access-control/visitors`):** Visitor registration workflow (`visitor-form.tsx`), host check-ins, and active visitor roster.
- **Badges (`/access-control/badges`):** Active badge inventory, status tracking, and expiration monitoring (`QRStatusDistributionChart`).
- **Security Reports (`/access-control/reports`):** Daily access summaries and audit logs.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Redis caching for fast role verification and real-time gate entry counts.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL` (`dept:access-control`)
  - `DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL_TAG` (`access:control`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_EMPLOYEES` (`table:employees`)
  - Dynamic tags: `dept:access-control:${deptId}`
- **Supabase Postgres + RLS:** Strict access control rules on `access_logs`, `visitors`, and `employee_badges`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `ACCESS_CONTROL_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` for security metrics, entity status panels, and visitor check-in forms.
  - `<GlassButton>` for check-in / check-out triggers.
  - Visualization charts: `HourlyAccessChart` and `QRStatusDistributionChart`.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/access-control`
- **Dashboard Tests:** `src/app/(departments)/access-control/__tests__/page.test.tsx`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
