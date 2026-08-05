# Arch System — Department Specification: Access Card Actions

## 1. Overview

- **Department Slug:** `access-card-actions`
- **Department Name:** Access Card Actions
- **Icon:** `CreditCard`
- **Type:** Standard Department (`type: 'standard'`)
- **Description:** Badge issuing, printed card registration, QR code generation, and hardware printer integration.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Accessible to employees with `access-card-actions`, `access_control`, or `admin` role.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies authenticated session and department permissions.
- **Server Action Protection:** Server actions in `actions.ts` enforce role validation before executing print actions.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-access-card-actions: #3b82f6` (`packages/theme/src/css/variables.css:117`)
- **Color Alias:** `blue`
- **Tailwind Safe-List:**
  - `dept-access-card-actions`
  - `bg-dept-access-card-actions`
  - `text-dept-access-card-actions`
  - `border-dept-access-card-actions`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/access-card-actions`):** Card printing statistics, recent badge issues, and printer hardware status.
- **Card Actions (`/access-card-actions/card-actions`):** Individual employee card management, status toggles, and PDF preview (`card-pdf.tsx`).
- **Print Cards (`/access-card-actions/print-cards`):** Batch card printing pipeline, registration form (`register-form.tsx`), and print status filtering (`status-filter.tsx`).
- **Print History (`/access-card-actions/print-history`):** Complete audit log of issued, reprinted, and revoked cards.
- **QR Codes (`/access-card-actions/qr-codes`):** High-security QR code generation, payload encryption, and code rotation (`qr-section.tsx`).
- **Reports (`/access-card-actions/reports`):** Card printing volume and consumable usage reports.
- **Hardware Integration (`lib/printer-detection.ts`):** Direct CUPS print spooler detection with fallback for non-CUPS environments (`printing.ts`).

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Redis caching for active printer states and printed badge records.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('5 minutes')` with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.TABLE_CARD_PRINTS` (`table:card_print_history`)
  - Dynamic tags: `dept:access-card-actions:${deptId}`
- **Supabase Postgres + RLS:** Database storage with RLS policies on `card_print_history` and `employee_badges`.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** `DepartmentLayout` with `ActiveDepartmentSetter` mounting `ACCESS_CARD_ACTIONS_TABS`.
- **Glass Components (@repo/ui):**
  - `<GlassCard>` for card design previews, employee selection lists, and printer status monitors.
  - `<GlassButton>` for print job triggers and QR regeneration.
  - Custom UI modules: `CardActionsTab`, `EmployeeSearch`, `RegisterForm`, `StatusFilter`, `QrSection`.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/access-card-actions`
- **Hardware & Action Tests:** `printing.test.ts`, `lib/__tests__/printer-detection.test.ts`, `card-actions/actions.test.ts`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
