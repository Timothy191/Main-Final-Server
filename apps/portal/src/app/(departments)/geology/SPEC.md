# Arch System — Department Specification: Geology & Survey

## 1. Overview

- **Department Slug:** `geology`
- **Department Name:** Geology & Survey
- **Icon:** `Mountain`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Mine survey measurements, pit topography updates, block modeling, resource estimation, and geological mapping.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Open to authenticated employees with `geology` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions enforce `assertDeptRole(['admin', 'geology', 'supervisor'], 'geology')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies session validity and department entitlement.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-geology: #8b5cf6` (`packages/theme/src/css/variables.css`)
- **Color Alias:** `violet`
- **Tailwind Safe-List:**
  - `dept-geology`
  - `bg-dept-geology`
  - `text-dept-geology`
  - `border-dept-geology`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/geology`):** Mine block status overview (`24 active blocks`), survey update frequency, pit volume calculations, and geological model status.
- **Survey (`/geology/survey`):** Total station survey imports, pit volume reconciliation, and crest/toe measurements (`table:survey_measurements`).
- **Mine Blocks (`/geology/blocks`):** Block model database, seam quality mapping, density estimates, and coal seam block status.
- **Survey Plans (`/geology/survey-plans`):** CAD survey plan approvals, pit expansion maps, and bench elevation plans (`table:survey_plans`).
- **Reports (`/geology/reports`):** Resource depletion reports, seam quality reconciliation, and survey certification documents.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Redis caching for active mine block models and survey station locations.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.GEOLOGY` (`dept:geology`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_SURVEY_MEASUREMENTS` (`table:survey_measurements`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_SURVEY_PLANS` (`table:survey_plans`)
  - Dynamic tags: `dept:geology:${deptId}`
- **Supabase Postgres + RLS:** Spatial data and mine block tables protected by Supabase RLS.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `GEOLOGY_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` for mine block matrices, survey plan previews, and volume metrics.
  - `<GlassButton>` for uploading survey data and approving pit plans.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/geology`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
