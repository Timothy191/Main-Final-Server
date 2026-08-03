import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { CursorPaginationControls } from '@/components/CursorPaginationControls'
import { EmptyState } from '@repo/ui/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table'
import { Clock, Inbox } from 'lucide-react'
import { getVisitorsForDepartmentCursor } from '../actions'
import { VisitorForm } from './visitor-form'

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; cursors?: string; limit?: string }>
}) {
  const params = await searchParams
  const limit = parseInt(params.limit || '50', 10)
  const previousCursors = params.cursors ? params.cursors.split(',').filter(Boolean) : []
  const cursor = params.cursor || undefined

  const { deptId } = await getDepartmentContext({
    department: 'access-control',
  })

  const { visitors, nextCursor, hasMore, totalCount } = await getVisitorsForDepartmentCursor(
    deptId,
    cursor,
    limit
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">Visitor Management</h2>
          <p className="text-sm text-arch-text-muted mt-1">
            Register guests, assign temporary credentials, and track site hosts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form (Left, 1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <VisitorForm />
        </div>

        {/* Active Visitors Table (Right, 2 cols) */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex justify-between items-center">
              <h3 className="font-semibold text-arch-text-primary flex items-center">
                <Clock className="w-4 h-4 mr-2 text-arch-text-muted" />
                Today&apos;s Visitors
              </h3>
              <span className="text-xs text-arch-text-muted">{totalCount} total visitors</span>
            </div>

            <div className="flex-1">
              {visitors.length === 0 ? (
                <div className="h-full flex items-center justify-center py-20">
                  <EmptyState
                    icon={Inbox}
                    title="No visitors registered"
                    description="There are no visitors recorded for this department today. Use the form to register a new guest."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-arch-border-default hover:bg-transparent">
                      <TableHead className="text-arch-text-muted">Visitor Name</TableHead>
                      <TableHead className="text-arch-text-muted">Company</TableHead>
                      <TableHead className="text-arch-text-muted">Reason</TableHead>
                      <TableHead className="text-arch-text-muted">Check-In</TableHead>
                      <TableHead className="text-right text-arch-text-muted">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map((visitor) => (
                      <TableRow
                        key={visitor.id}
                        className="border-b border-arch-border-default/50 hover:bg-arch-surface-tertiary transition-colors"
                      >
                        <TableCell className="font-medium text-arch-text-primary">
                          {visitor.first_name} {visitor.surname}
                        </TableCell>
                        <TableCell className="text-arch-text-secondary">
                          {visitor.company || '—'}
                        </TableCell>
                        <TableCell className="text-arch-text-secondary">
                          {visitor.reason_for_entry || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-arch-text-secondary">
                          {visitor.check_in_time
                            ? new Date(visitor.check_in_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {visitor.status === 'Checked In' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50/70 border-emerald-200/50 text-emerald-700">
                              <span className="badge-pulse-dot bg-emerald-500" />
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border bg-arch-surface-secondary text-arch-text-muted border-arch-border-default">
                              {visitor.status || '—'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Cursor-based Pagination */}
            {totalCount > 0 && (
              <CursorPaginationControls
                nextCursor={nextCursor}
                previousCursors={previousCursors}
                hasNextPage={hasMore}
                pageSize={limit}
                loadedCount={visitors.length}
                totalCount={totalCount}
                currentCursor={cursor}
              />
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
