import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { CursorPaginationControls } from '@/components/CursorPaginationControls'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table'
import { ShieldOff, Clock } from 'lucide-react'
import { getAccessLogsForDepartmentCursor } from '../actions'

interface AccessLogWithBadge {
  id: string
  scanned_at: string
  gate_location: string
  access_granted: boolean
  denial_reason: string | null
  access_type: string
  direction: string
  badge: {
    qr_code: string
    entity_type: string
    personnel: { first_name: string; surname: string } | null
    visitor: { first_name: string; surname: string } | null
  }
}

export default async function AccessLogsPage({
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

  const { logs, nextCursor, hasMore, totalCount } = await getAccessLogsForDepartmentCursor(
    deptId,
    cursor,
    limit
  )

  const resolvedLogs = ((logs ?? []) as unknown as AccessLogWithBadge[]).map((log) => {
    const { badge } = log
    let entityName = 'Unknown'
    let entityType: string = badge?.entity_type ?? 'Unknown'

    if (badge?.personnel) {
      entityName = `${badge.personnel.first_name} ${badge.personnel.surname}`
      entityType = 'Employee'
    } else if (badge?.visitor) {
      entityName = `${badge.visitor.first_name} ${badge.visitor.surname}`
      entityType = 'Visitor'
    }

    let status = log.access_granted ? 'Granted' : 'Denied'
    if (!log.access_granted && log.denial_reason) {
      if (log.denial_reason.includes('Expired') || log.denial_reason.includes('expired')) {
        status = 'Expired Credential'
      } else if (log.denial_reason.includes('Tailgate')) {
        status = 'Tailgate Alert'
      }
    }

    return {
      id: log.id,
      timestamp: log.scanned_at,
      entityName,
      entityType,
      qrCodeId: badge?.qr_code ?? 'N/A',
      zone: log.gate_location,
      accessMethod: log.access_type ?? 'QR Scan',
      status,
      direction: log.direction,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">Access Logs</h2>
          <p className="text-sm text-arch-text-muted mt-1">
            Recent scan events across all entry points for this department.
          </p>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex justify-between items-center">
          <h3 className="font-semibold text-arch-text-primary flex items-center">
            <Clock className="w-4 h-4 mr-2 text-arch-text-muted" />
            Recent Events
          </h3>
          <span className="text-xs text-arch-text-muted">{totalCount} total events</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-arch-border-default hover:bg-transparent">
              <TableHead className="text-arch-text-muted">Time</TableHead>
              <TableHead className="text-arch-text-muted">Entity</TableHead>
              <TableHead className="text-arch-text-muted">Type</TableHead>
              <TableHead className="text-arch-text-muted">QR Code</TableHead>
              <TableHead className="text-arch-text-muted">Zone</TableHead>
              <TableHead className="text-arch-text-muted">Direction</TableHead>
              <TableHead className="text-right text-arch-text-muted">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resolvedLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-arch-text-muted">
                  No access logs found for this department.
                </TableCell>
              </TableRow>
            )}
            {resolvedLogs.map((log) => (
              <TableRow
                key={log.id}
                className="border-b border-arch-border-default/50 hover:bg-arch-surface-tertiary transition-colors"
              >
                <TableCell className="font-mono text-sm text-arch-text-secondary">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}
                </TableCell>
                <TableCell className="font-medium text-arch-text-primary">
                  {log.entityName}
                </TableCell>
                <TableCell className="text-arch-text-secondary capitalize">
                  {log.entityType}
                </TableCell>
                <TableCell className="font-mono text-sm text-arch-accent-charcoal">
                  {log.qrCodeId}
                </TableCell>
                <TableCell className="text-arch-text-secondary">{log.zone}</TableCell>
                <TableCell className="text-arch-text-secondary">{log.direction}</TableCell>
                <TableCell className="text-right">
                  {log.status === 'Granted' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50/70 border-emerald-200/50 text-emerald-700">
                      <span className="badge-pulse-dot bg-emerald-500" />
                      Granted
                    </span>
                  ) : log.status === 'Denied' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-50/70 border-red-200/50 text-red-700">
                      <ShieldOff className="w-3 h-3" />
                      Denied
                    </span>
                  ) : log.status === 'Expired Credential' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-50/70 border-amber-200/50 text-amber-700">
                      <Clock className="w-3 h-3" />
                      Expired
                    </span>
                  ) : (
                    <span className="text-xs text-arch-text-muted font-mono">{log.status}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Cursor-based Pagination */}
        {totalCount > 0 && (
          <CursorPaginationControls
            nextCursor={nextCursor}
            previousCursors={previousCursors}
            hasNextPage={hasMore}
            pageSize={limit}
            loadedCount={logs.length}
            totalCount={totalCount}
            currentCursor={cursor}
          />
        )}
      </GlassCard>
    </div>
  )
}
