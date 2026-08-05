# Arch System — Department Specification: Drilling

## 1. Overview

- **Department Slug:** `drilling`
- **Department Name:** Drilling
- **Icon:** `Drill`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Drill rig operations, blast design, and bit depth telemetry tracking.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Top-level route `/drilling` is open to all authenticated employees with `drilling` listed in `accessible_departments` (`isDeptAllowedForRole`).
- **Restricted Sub-Routes / Actions:** Server actions in `actions.ts` enforce role assertions via `assertDeptRole(['admin', 'drilling', 'supervisor'], 'drilling')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies session and department membership before routing.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-drilling: #2563eb` (`packages/theme/src/css/variables.css:114`)
- **Color Alias:** `blue`
- **Tailwind Safe-List:**
  - `dept-drilling`
  - `bg-dept-drilling`
  - `text-dept-drilling`
  - `border-dept-drilling`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/drilling`):** KPI overview including total depth drilled, active rig count, total operating hours, and operational delays.
- **Drill Operations (`/drilling/drilling-operations`):** Rig shift logs, operator tracking, meters drilled, and hole count tracking via `DrillingOperationsTable`.
- **Blast Design (`/drilling/blast-design`):** Designed vs actual holes, explosive tonnage (`totalExplosiveKg`), blast status lifecycle (`designed`, `loaded`, `fired`, `mucked`, `reviewed`, `cancelled`), and mine block linkage.
- **Machine Telemetry (`/drilling/machine-telemetry`):** Real-time drill rig telemetry, engine status, vibration, and depth sensors.
- **Drilling Reports (`/drilling/reports`):** Daily and shift-level drilling performance and delay reporting.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Edge-proxy employee auth and session resolution cached in Redis (`arch:auth:employee:<userId>`).
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.DRILLING` (`dept:drilling`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_DAILY_LOGS` (`table:daily_logs`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_MACHINES` (`table:machines`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_DRILL_OPERATIONS` (`table:drill_operations`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_BLAST_DESIGNS` (`table:blast_designs`)
  - Dynamic tags: `dept:drilling:${deptId}`, `dept:drilling:${deptId}:${today}`
- **Supabase Postgres + RLS:** Direct querying via `createAdminClient()` inside server-cached calls, enforced by Postgres RLS policies on `drill_operations`, `blast_designs`, `daily_logs`, and `machines`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `DRILLING_TABS`.
- **System Chrome:** `.os-shell--taskbar` header and department panel sidebar.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` and `.glass-depth-card` for KPI cards and telemetry widgets.
  - `<GlassButton>` for action triggers (e.g. Export, Log Operation).
- **Typography & Theme:** Inter font for body telemetry data, Anurati/Outfit headings, using `--arch-glass-*` tokens.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/drilling`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
