import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'

export function MachineOpsSkeleton() {
  return (
    <GlassCard className="overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse min-w-full">
          <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
            <TableRow>
              {Array.from({ length: 13 }).map((_, i) => (
                <TableHead key={i} className="px-3 py-3 font-semibold whitespace-nowrap">
                  <div className="h-4 w-16 bg-arch-border/50 rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="border-b border-arch-border/50">
                {Array.from({ length: 13 }).map((_, j) => (
                  <TableCell key={j} className="px-3 py-3">
                    <div className="h-4 w-full bg-arch-border/30 rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
