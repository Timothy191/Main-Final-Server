# Arch System — Department Specification: Satellite Monitoring

## 1. Overview

- **Department Slug:** `satellite-monitoring`
- **Department Name:** Satellite Monitoring
- **Icon:** `Satellite`
- **Type:** Satellite Department (`type: 'satellite'`)
- **Description:** High-resolution optical satellite imagery, InSAR ground subsidence telemetry, SAR deformation analytics, and hyperspectral surface monitoring.

---

## 2. Role Restrictions & Access Control

- **ACL Enforcement (@repo/acl):** Open to authenticated employees with `satellite-monitoring` department access or `admin`/`supervisor` roles.
- **Server Action Protection:** Actions enforce `assertDeptRole(['admin', 'satellite-monitoring', 'supervisor'], 'satellite-monitoring')`.
- **Edge Proxy Gate:** `apps/portal/src/proxy.ts` verifies session validity and department membership.

---

## 3. Department Color Tokens & Safe-List

- **CSS Custom Property:** `--dept-satellite: #4f46e5` (`packages/theme/src/css/variables.css:122`)
- **Color Alias:** `indigo`
- **Tailwind Safe-List:**
  - `dept-satellite`
  - `bg-dept-satellite`
  - `text-dept-satellite`
  - `border-dept-satellite`

---

## 4. Features & Telemetry Modules Served

- **Dashboard (`/satellite-monitoring`):** Latest satellite pass metadata, pit displacement summaries, and active geotechnical anomaly alerts.
- **SAR / InSAR (`/satellite-monitoring/sar`):** Synthetic Aperture Radar interferometry, millimeter-level slope movement tracking, and subsidence displacement maps.
- **Hyperspectral (`/satellite-monitoring/hyperspectral`):** Mineral composition analysis, surface moisture mapping, and environmental degradation detection.
- **High-Resolution (`/satellite-monitoring/highres`):** Optical sub-meter satellite imagery viewport, panchromatic sharpening, and temporal change detection.
- **Alerts (`/satellite-monitoring/alerts`):** Automated ground movement trigger alerts (`table:satellite_alerts`) and structural warning notifications.

---

## 5. Cache Tagging Strategy

- **L1/L2 Redis Layer:** Redis caching for active imagery metadata and geo-fence displacement warnings.
- **Next.js 16 Data Cache (`"use cache"`):** Uses `cacheLife('15 minutes')` (longer TTL for slow-changing orbital raster data) with tags from `DEPARTMENT_CACHE_TAGS`:
  - `DEPARTMENT_CACHE_TAGS.SATELLITE_MONITORING` (`dept:satellite-monitoring`)
  - `DEPARTMENT_CACHE_TAGS.TABLE_SATELLITE_ALERTS` (`table:satellite_alerts`)
  - Dynamic tags: `dept:satellite-monitoring:${deptId}`
- **Supabase Postgres + RLS:** GeoJSON and vector metadata stored in Supabase with spatial index and RLS protection.

---

## 6. UI Layout & Glass Components

- **Layout Shell:** Full-screen optimized `DepartmentLayout` mounting `SATELLITE_MONITORING_TABS`.
- **Glass Components (@repo/ui):**
  - Overlaid `<GlassCard>` panels over dark GIS viewports (`.glass-dark` / `.glass-video`).
  - `<GlassButton>` for layer switching (SAR, Optical, Topo) and opacity controls.

---

## 7. Quality & Verification Gates

- **Unit & Integration Tests:** `pnpm --filter portal test -- src/app/(departments)/satellite-monitoring`
- **Type Checking & Linting:** `pnpm exec turbo run lint type-check test --force`
- **CI Gate Suite:** `pnpm gates` (`agents:verify`, `design:ratchet`, `theme:shape`, `lint:tokens`)
- **Formatting:** `pnpm format:check`
