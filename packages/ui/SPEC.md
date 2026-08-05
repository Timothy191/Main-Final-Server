# @repo/ui — Specification

Component library featuring shadcn-style React components styled with Arch System tokens, Glass UI surfaces, and Framer Motion primitives.

## 1. Overview & Architecture

`@repo/ui` provides accessible, high-performance UI primitives built on Radix UI, Framer Motion, Lucide icons, and RevoGrid.

---

## 2. Exported Specification

### 2.1 Canonical UI Primitives (`components/ui/*`)

- **Form & Input:** `Button`, `Input`, `Checkbox`, `Kbd`
- **Feedback & Loading:** `Badge`, `Skeleton`, `GlassSkeleton`, `Spinner`, `ActionConfirmDialog`
- **Data Display:** `Card`, `Table`, `Tabs`, `DataGrid` (RevoGrid wrapper), `BentoGrid`, `Avatar`
- **Overlay & Navigation:** `Dialog`, `DropdownMenu`, `Pagination`, `CursorPagination`, `Separator`, `ScrollArea`

### 2.2 Custom / Layout Primitives (`components/*`)

- `Logo`, `GlassCard`, `AnimatedButton`, `PageHeader`, `DepartmentLayout`, `SecondaryButton`, `KPI`, `AnimatedList`, `Marquee`

### 2.3 Utilities

- `cn(...inputs)`: Tailwind class merger (`clsx` + `tailwind-merge`)

---

## 3. Dependencies

- `dependencies`: `clsx`, `tailwind-merge`, `framer-motion`, `lucide-react`, `next`, `@repo/theme`, `@revolist/react-datagrid`, `@revolist/revogrid`, `@radix-ui/react-scroll-area`, `@radix-ui/react-separator`
- `peerDependencies`: `react` (`^19.0.0`), `react-dom` (`^19.0.0`)
