# Arch System — Department Specification: Control Room

## 1. Overview

- **Department Slug:** `control-room`
- **Department Name:** Control Room
- **Icon:** `Monitor`
- **Type:** Control Room Department (`type: 'control_room'`)
- **Description:** Central SCADA monitoring, mine dispatching, real-time hourly load management, and excavator telemetry.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** **RESTRICTED ROUTE.** Enforced by `RESTRICTED_DEPT_ROLES['control-room'] = ['control_room_operator', 'admin']`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` evaluates `isRestrictedRouteAllowed('/control-room', ...)` and blocks unauthorized users.
- **Server Action Protection:** Actions in `actions.ts` enforce `assertDeptRole(['admin', 'control_room_operator'], 'control-room')`.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-control-room: #dc2626` (`packages/theme/src/css/variables.css:119`)
- **Color Alias:** `red`
- **Tailwind Safe-List:**
  - `dept-control-room`
  - `bg-dept-control-room`
  - `text-dept-control-room`
  - `border-dept-control-room`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/control-room`):** Real-time SCADA alert feed, live pit activity monitors, and critical dispatch metrics.
- **Hourly Loads (`/control-room/hourly-loads`):** Hourly coal and waste tonnage tracking per machine via `HourlyLoadsTable` and `HourlyLoadCell`.
- **Machine Operations (`/control-room/machine-operations`):** Real-time equipment status, delay logging (`delay_entries`), and operator shift assignments.
- **Dozer Rollover (`/control-room/dozer-rollover`):** Dozer earthmoving rollover volume calculations via `DozerRolloverClient` (Formula: `Total Worked Hours × 250 BCM/hr`).
- **Engineering Notes (`/control-room/engineering-notes`):** Shift handover notes, structural alerts, and engineering instructions.
- **Excavator Activity (`/control-room/excavator-activity`):** Dig rate telemetry, payload efficiency, and cycle time tracking via `ExcavatorActivityBuilder`.
- **Reports (`/control-room/reports`):** Operational delay summaries, hourly production reports, and SCADA audit logs.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** High-frequency real-time SCADA streams and dispatch state bypass long caches; active dispatch data stored in Redis.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` for aggregate metrics:
  - `DEPARTMENT_CACHE_TAGS.CONTROL_ROOM` (`dept:control-room`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_HOURLY_LOADS` (`table:hourly_loads`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_MACHINE_OPERATIONS` (`table:machine_operations`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_OPERATIONAL_DELAYS` (`table:operational_delays`)
  - Dynamic tags: `dept:control-room:${deptId}`
- **Supabase Postgres + RLS:** Multi-tenant RLS protection on `hourly_loads`, `machine_operations`, and `engineering_notes`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** Specialized `DepartmentLayout` with `ActiveDepartmentSetter` mounting `CONTROL_ROOM_TABS`.
- **Glass Components (@repo/ui):**
  - High-contrast `.glass-card` / `.glass-depth-card` optimized for control room multi-monitor displays.
  - `<GlassButton>` for rapid alert acknowledgment and shift status toggles.
  - Custom UI modules: `HourlyLoadsTable`, `HourlyLoadCell`, `ExcavatorActivityBuilder`.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/control-room`
- **Module Tests:** `actions.test.ts`, `excavator-activity/ExcavatorActivityBuilder.test.tsx`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
