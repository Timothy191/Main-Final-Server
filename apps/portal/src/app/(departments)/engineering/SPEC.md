# Arch System — Department Specification: Engineering

## 1. Overview

- **Department Slug:** `engineering`
- **Department Name:** Engineering
- **Icon:** `Wrench`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Heavy equipment maintenance, mechanical breakdown tracking, tire telemetry, and CAD/engineering specs.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Top-level route `/engineering` is open to authenticated employees with `engineering` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions enforce role checks via `assertDeptRole(['admin', 'engineering', 'supervisor'], 'engineering')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` gates route entry based on employee department rights.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-engineering: #7c3aed` (`packages/theme/src/css/variables.css:118`)
- **Color Alias:** `violet`
- **Tailwind Safe-List:**
  - `dept-engineering`
  - `bg-dept-engineering`
  - `text-dept-engineering`
  - `border-dept-engineering`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/engineering`):** Open work order count, critical equipment breakdowns, and fleet availability metrics.
- **Breakdowns (`/engineering/breakdowns`):** Maintenance requests, failure root-cause logging, MTBF/MTTR tracking, and repair status.
- **Tire Management (`/engineering/tire-management`):** Haul truck tire telemetry, pressure/temperature monitoring, thread wear tracking (`table:tires`).
- **Daily Log (`/engineering/daily-log`):** Mechanical shift logs and work order updates.
- **Machines (`/engineering/machines`):** Equipment specifications, engine health, and maintenance history.
- **History (`/engineering/history`):** Historical repair archives and maintenance logs.
- **Reports (`/engineering/reports`):** Availability metrics, failure analysis, and component lifespan reports.
- **Tools (`/engineering/tools`):** Stress, load, and component life calculation tools.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Redis caching for active machine breakdown states and fleet availability alerts.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.ENGINEERING` (`dept:engineering`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_BREAKDOWNS` (`table:breakdowns`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_MACHINES` (`table:machines`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_TIRES` (`table:tires`)
  - Dynamic tags: `dept:engineering:${deptId}`
- **Supabase Postgres + RLS:** Database persistence secured by RLS policies on `equipment_breakdowns`, `tires`, and `machines`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `ENGINEERING_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` / `.glass-depth-card` for equipment status cards and tire pressure grids.
  - `<GlassButton>` for creating work orders and scheduling maintenance.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/engineering`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
