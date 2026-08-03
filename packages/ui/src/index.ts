/**
 * @repo/ui — shared React primitives (shadcn-style)
 * Re-export all components from canonical locations.
 *
 * Canonical paths:
 *   @repo/ui/components/ui/*  — full-featured shadcn-style components
 *   @repo/ui/components/*     — legacy/large custom components
 *
 * Portal code should prefer @repo/ui/components/ui/* for standard primitives,
 * but the named exports below provide shorthand access for common cases.
 */

// Canonical UI primitives (shadcn-style with Arch tokens)
export { Button } from './components/ui/button'
export { Badge } from './components/ui/badge'
export { Input } from './components/ui/input'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/ui/card'
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from './components/ui/dialog'
export { Table, TableHeader, TableRow, TableCell } from './components/ui/table'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
export { ActionConfirmDialog } from './components/ui/action-confirm-dialog'
export { Skeleton } from './components/ui/skeleton'
export { GlassSkeleton } from './components/ui/glass-skeleton'
export { Pagination, CursorPagination } from './components/ui/pagination'
export { encodeCursor, decodeCursor } from './components/ui/pagination-cursor'
export type { PaginationProps, CursorPaginationProps } from './components/ui/pagination'
export { Separator } from './components/ui/separator'
export { ScrollArea } from './components/ui/scroll-area'
export { DropdownMenu } from './components/ui/dropdown-menu'
export { DataGrid } from './components/ui/data-grid'
export { BentoGrid } from './components/ui/bento-grid'
export { Avatar } from './components/ui/avatar'
export { Kbd } from './components/ui/kbd'

// Legacy/large custom components
export { Logo } from './components/Logo'
export { GlassCard } from './components/GlassCard'
export { Spinner } from './components/ui/spinner'
export { AnimatedButton } from './components/AnimatedButton'
export { PageHeader } from './components/PageHeader'
export { DepartmentLayout } from './components/DepartmentLayout'
export { SecondaryButton } from './components/SecondaryButton'
export { KPI } from './components/KPI'
export { AnimatedList } from './components/AnimatedList'
export { Marquee } from './components/Marquee'
export { Checkbox } from './components/Checkbox'

// Re-export utilities
export { cn } from './lib/utils'
