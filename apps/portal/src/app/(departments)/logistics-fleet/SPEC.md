# Arch System — Department Specification: Logistics & Fleet

## 1. Overview

- **Department Slug:** `logistics-fleet`
- **Department Name:** Logistics & Fleet
- **Icon:** `Truck`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Haul truck & light vehicle fleet tracking, fuel dispensing telemetry, site logistics, and transport maintenance scheduling.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Open to authenticated employees with `logistics-fleet` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions enforce `assertDeptRole(['admin', 'logistics-fleet', 'supervisor'], 'logistics-fleet')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies user authentication and department entitlements.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-logistics-fleet: #6366f1` (`packages/theme/src/css/variables.css`)
- **Color Alias:** `indigo`
- **Tailwind Safe-List:**
  - `dept-logistics-fleet`
  - `bg-dept-logistics-fleet`
  - `text-dept-logistics-fleet`
  - `border-dept-logistics-fleet`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/logistics-fleet`):** Active vehicle count (`118 active`), daily fuel burn rate, transport efficiency, and active maintenance queue.
- **Fleet (`/logistics-fleet/fleet`):** Haul truck telemetry, vehicle status (Active, In-Shop, Standby), GPS location, and odometer logs (`table:fleet`).
- **Fuel (`/logistics-fleet/fuel`):** Fuel bay dispensing telemetry, tank level monitoring, and burn efficiency per machine (`table:fuel_logs`).
- **Maintenance (`/logistics-fleet/maintenance`):** Scheduled vehicle servicing, oil change logs, and preventative maintenance queue (`table:fleet_maintenance_schedule`).
- **Reports (`/logistics-fleet/reports`):** Fleet utilization reports, fuel consumption summaries, and transport efficiency analytics.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Real-time GPS location and fuel tank levels cached in Redis for low-latency dispatch queries.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.LOGISTICS_FLEET` (`dept:logistics-fleet`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_FLEET` (`table:fleet`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_FUEL_LOGS` (`table:fuel_logs`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_FLEET_MAINT` (`table:fleet_maintenance_schedule`)
  - Dynamic tags: `dept:logistics-fleet:${deptId}`
- **Supabase Postgres + RLS:** Secured data access on `vehicles`, `fuel_logs`, and `fleet_maintenance_schedule`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `LOGISTICS_FLEET_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` for vehicle telemetry grids, fuel level meters, and fleet status overview.
  - `<GlassButton>` for scheduling service and logging fuel fills.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/logistics-fleet`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
