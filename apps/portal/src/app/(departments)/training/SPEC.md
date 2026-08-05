# Arch System — Department Specification: Training

## 1. Overview

- **Department Slug:** `training`
- **Department Name:** Training
- **Icon:** `GraduationCap`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Learning management system (LMS), competency tracking, workforce certification, and course scheduling.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Open to authenticated employees with `training` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions enforce `assertDeptRole(['admin', 'training', 'supervisor'], 'training')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies authenticated session and department rights.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-training: #0891b2` (`packages/theme/src/css/variables.css:121`)
- **Color Alias:** `cyan`
- **Tailwind Safe-List:**
  - `dept-training`
  - `bg-dept-training`
  - `text-dept-training`
  - `border-dept-training`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/training`):** Overview of active training programs, upcoming course enrollments, and site certification compliance.
- **Certifications (`/training/certifications`):** Workforce competency tracking, expiring license alerts, and qualification verification (`table:certifications`).
- **Courses (`/training/courses`):** LMS course catalog, module completion tracking, and assessment scores (`table:training_courses`).
- **Trainees (`/training/trainees`):** Trainee profiles, learning progress, and attendance history (`table:training_trainees`).
- **Instructors (`/training/instructors`):** Certified trainer roster, availability, and course assignments (`table:training_instructors`).
- **Schedules (`/training/schedules`):** Classroom and simulator training calendar (`table:training_schedules`).
- **Archive (`/training/archive`):** Historical training records and archived certification documents.
- **Reports (`/training/reports`):** Qualification matrix and compliance audit reports.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Caching for employee certification status and active course catalog.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.TRAINING` (`dept:training`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_CERTIFICATIONS` (`table:certifications`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_COURSES` (`table:training_courses`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_SCHEDULES` (`table:training_schedules`)
  - Dynamic tags: `dept:training:${deptId}`
- **Supabase Postgres + RLS:** Database security policies on `certifications`, `training_courses`, and `training_schedules`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `TRAINING_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` with `.glass-card` for course cards, progress meters, and certification badges.
  - `<GlassButton>` for course enrollment and certificate issuance.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/training`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
