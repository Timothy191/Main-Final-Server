# Arch System — Department Specification: Production

## 1. Overview

- **Department Slug:** `production`
- **Department Name:** Production
- **Icon:** `Factory`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Coal yield, tonnage tracking, strip ratio calculations, and material extraction tracking.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Top-level route `/production` is open to all authenticated employees with `production` listed in `accessible_departments` (`isDeptAllowedForRole`).
- **Restricted Sub-Routes / Actions:** Server actions in `actions.ts` and `grade-control/actions.ts` enforce role assertions via `assertDeptRole(['admin', 'production', 'supervisor'], 'production')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` checks session validity and department membership.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-production: #34c759` (`packages/theme/src/css/variables.css:115`)
- **Color Alias:** `emerald`
- **Tailwind Safe-List:**
  - `dept-production`
  - `bg-dept-production`
  - `text-dept-production`
  - `border-dept-production`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/production`):** Daily coal tonnage (`coalTonnesToday`), waste tonnage (`wasteTonnesToday`), active machine count, and calculated strip ratio (`waste/coal`).
- **Daily Log (`/production/daily-log`):** Shift logging (`day`/`night`), tonnage entries, and shift startup via `ShiftControls`.
- **Grade Control (`/production/grade-control`):** Quality sampling, ash content, moisture content, and yield reconciliation metrics.
- **Machine Fleet (`/production/machines`):** Active haul trucks, excavators, and loader utilization tracking.
- **Production History (`/production/history`):** Historical extraction trends and shift comparisons.
- **Production Reports (`/production/reports`):** Shift summary reports, tonnage export, and delay summaries.
- **Operational Tools (`/production/tools`):** Volume and tonnage calculators.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Session and role permissions cached in Redis.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.PRODUCTION` (`dept:production`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_MACHINES` (`table:machines`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS` (`table:daily_logs`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_GRADE_CONTROL` (`table:grade_control_samples`)
  - Dynamic tags: `dept:production:${deptId}`
- **Cache Invalidation:** Mutations (`startShift`, `logProductionEntry`, `recordDelay`) call `revalidateTag(DEPARTMENT_CACHE_TAGS.PRODUCTION)` and `revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS)`.
- **Supabase Postgres + RLS:** Secured multi-tenant database access on `daily_logs`, `production_logs`, `operational_delays`, and `grade_control_samples`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `PRODUCTION_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` / `.glass-depth-card` for KPI stats (Yield %, Coal Tonnes, Strip Ratio).
  - `<GlassButton>` for shift control actions.
  - Interactive shift controls (`ShiftControls.tsx`) with glass background styling.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/production`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
