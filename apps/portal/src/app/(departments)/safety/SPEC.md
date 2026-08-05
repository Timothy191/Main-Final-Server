# Arch System — Department Specification: Safety

## 1. Overview

- **Department Slug:** `safety`
- **Department Name:** Safety
- **Icon:** `HardHat`
- **Type:** Safety Department (`type: 'safety'`)
- **Description:** Incident management, Job Safety Analysis (JSA), hazard observations, compliance auditing, and LTI tracking.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Route `/safety` is open to authenticated employees with `safety` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions enforce `assertDeptRole(['admin', 'safety', 'supervisor'], 'safety')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies session and department authorization.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-safety: #d97706` (`packages/theme/src/css/variables.css:120`)
- **Color Alias:** `amber` / `blue`
- **Tailwind Safe-List:**
  - `dept-safety`
  - `bg-dept-safety`
  - `text-dept-safety`
  - `border-dept-safety`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/safety`):** LTI-free days counter, open incident tracker, and safety observation statistics.
- **Daily Log (`/safety/daily-log`):** Daily safety briefings, toolbox talks, and inspection logs.
- **Observations (`/safety/observations`):** Hazard reporting, unsafe condition cards, and positive behavior observations (`table:safety_observations`).
- **JSA (`/safety/jsa`):** Job Safety Analysis creation, risk scoring, and control measure sign-offs (`table:job_safety_analyses`).
- **Audit Dashboard (`/safety/audit-dashboard`):** Regulatory audit logs, compliance checks, and inspection histories.
- **Archive (`/safety/archive`):** Archived safety procedures, SOPs, and historical incident records.
- **Machines (`/safety/machines`):** Equipment safety inspection records and emergency stop checks.
- **Reports (`/safety/reports`):** Incident statistics, near-miss trends, and OSHA/compliance reporting.
- **Tools (`/safety/tools`):** Risk matrix calculators and hazard assessment tools.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Fast caching for LTI count and active emergency notifications.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.SAFETY` (`dept:safety`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_INCIDENTS` (`table:safety_incidents`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_OBSERVATIONS` (`table:safety_observations`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_JSA` (`table:job_safety_analyses`)
  - Dynamic tags: `dept:safety:${deptId}`
- **Supabase Postgres + RLS:** Secured data access on `safety_incidents`, `safety_observations`, and `job_safety_analyses`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `SAFETY_TABS`.
- **Glass Components (@repo/ui):**
  - High-visibility `<GlassCard>` widgets for LTI counters and critical hazard alerts.
  - `<GlassButton>` for instant incident logging and hazard submission.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/safety`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
