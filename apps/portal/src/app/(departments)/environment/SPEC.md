# Arch System — Department Specification: Environment

## 1. Overview

- **Department Slug:** `environment`
- **Department Name:** Environment
- **Icon:** `Leaf`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Environmental telemetry monitoring (dust, water quality, noise, gas emissions), compliance tracking, and incident remediation.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Open to authenticated employees with `environment` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions in `actions.ts` and `incidents/actions.ts` enforce `assertDeptRole(['admin', 'environment', 'supervisor'], 'environment')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` gates access based on employee department rights.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-environment: #10b981` (`packages/theme/src/css/variables.css`)
- **Color Alias:** `emerald`
- **Tailwind Safe-List:**
  - `dept-environment`
  - `bg-dept-environment`
  - `text-dept-environment`
  - `border-dept-environment`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/environment`):** Overall environmental compliance score (`98%`), latest sensor readings summary, and active remediation count.
- **Readings (`/environment/readings`):** Real-time telemetry for dust particulate (PM10/PM2.5), water pH/turbidity, noise decibels, and gas emissions (`table:environmental_readings`).
- **Incidents (`/environment/incidents`):** Environmental spill and threshold exceedance logging (`table:environmental_incidents`), containment tracking, and root-cause analysis.
- **Compliance (`/environment/compliance`):** EPA / regulatory permit threshold limits, compliance status gauges, and audit readiness.
- **Reports (`/environment/reports`):** Monthly environmental impact statements and statutory compliance exports.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Redis caching for live sensor stream buffer and active threshold alert notifications.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.ENVIRONMENT` (`dept:environment`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_ENVIRONMENTAL_READINGS` (`table:environmental_readings`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_ENV_INCIDENTS` (`table:environmental_incidents`)
  - Dynamic tags: `dept:environment:${deptId}`
- **Supabase Postgres + RLS:** Time-series reading logs and incident records protected by Supabase RLS.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `ENVIRONMENT_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` for sensor sparklines and compliance gauge cards.
  - `<GlassButton>` for logging environmental incidents and exporting telemetry.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/environment`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
