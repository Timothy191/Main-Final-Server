import { PageHeader } from '@repo/ui/PageHeader'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table'
import { Button } from '@repo/ui/components/ui/button'
import {
  Printer,
  RefreshCw,
  Trash2,
  XCircle,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  CheckCircle,
  Layers,
} from 'lucide-react'
import {
  rescanPrinters,
  getPrintJobs,
  unregisterPrinter,
  cancelPrintJob,
  retryPrintJob,
} from '../actions'
import { RegisterPrinterForm } from './register-form'
import { StatusFilter } from './status-filter'
import { cn } from '@repo/ui/lib/utils'

/* ------------------------------------------------------------------ */
/*  Wrapper server actions for form actions                             */
/*  Discard return values so they satisfy Promise<void>                 */
/* ------------------------------------------------------------------ */

async function rescanAction() {
  'use server'
  await rescanPrinters()
}

async function unregisterAction(printerId: string) {
  'use server'
  await unregisterPrinter(printerId)
}

async function cancelAction(jobId: string) {
  'use server'
  await cancelPrintJob(jobId)
}

async function retryAction(jobId: string) {
  'use server'
  await retryPrintJob(jobId)
}

/* ------------------------------------------------------------------ */
/*  Status badge helpers                                               */
/* ------------------------------------------------------------------ */

function PrinterStatusPill({ status }: { status: string }) {
  if (status === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-accent-green/10 border-accent-green/20 text-accent-green">
        <Wifi className="w-3 h-3" />
        Online
      </span>
    )
  }
  if (status === 'offline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50/70 border-red-200/50 text-red-700">
        <WifiOff className="w-3 h-3" />
        Offline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50/70 border-amber-200/50 text-amber-700">
      <AlertTriangle className="w-3 h-3" />
      Error
    </span>
  )
}

function JobStatusPill({ status }: { status: string }) {
  const pills: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    queued: {
      label: 'Queued',
      icon: <Clock className="w-3 h-3" />,
      className: 'bg-blue-50/70 border-blue-200/50 text-blue-700',
    },
    rendering: {
      label: 'Rendering',
      icon: <Layers className="w-3 h-3" />,
      className: 'bg-violet-50/70 border-violet-200/50 text-violet-700',
    },
    printing: {
      label: 'Printing',
      icon: <Printer className="w-3 h-3" />,
      className: 'bg-cyan-50/70 border-cyan-200/50 text-cyan-700',
    },
    completed: {
      label: 'Completed',
      icon: <CheckCircle className="w-3 h-3" />,
      className: 'bg-accent-green/10 border-accent-green/20 text-accent-green',
    },
    failed: {
      label: 'Failed',
      icon: <XCircle className="w-3 h-3" />,
      className: 'bg-red-50/70 border-red-200/50 text-red-700',
    },
    cancelled: {
      label: 'Cancelled',
      icon: <Trash2 className="w-3 h-3" />,
      className: 'bg-amber-50/70 border-amber-200/50 text-amber-700',
    },
  }

  const pill = pills[status] ?? {
    label: status,
    icon: null,
    className: 'bg-gray-50/70 border-gray-200/50 text-gray-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
        pill.className
      )}
    >
      {pill.icon}
      {pill.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function PrintCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status ?? 'all'

  const [{ printers }, { jobs }] = await Promise.all([
    rescanPrinters().catch(() => ({ printers: [], count: 0 })),
    getPrintJobs(statusFilter === 'all' ? undefined : statusFilter).catch(() => ({ jobs: [] })),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Print Cards" showDate />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ────────── Left Panel: Printers ────────── */}
        <div className="space-y-4">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex items-center justify-between">
              <h3 className="font-medium text-arch-text-primary flex items-center">
                <Printer className="w-4 h-4 mr-2 text-arch-text-muted" />
                Printers
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-arch-text-muted">{printers.length} detected</span>
                <form action={rescanAction}>
                  <Button type="submit" size="sm" variant="outline" className="text-xs font-medium">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Rescan
                  </Button>
                </form>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-arch-border-default hover:bg-transparent">
                  <TableHead className="text-arch-text-muted">Name</TableHead>
                  <TableHead className="text-arch-text-muted">Model</TableHead>
                  <TableHead className="text-arch-text-muted">CUPS Queue</TableHead>
                  <TableHead className="text-arch-text-muted">Status</TableHead>
                  <TableHead className="text-right text-arch-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {printers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-arch-text-muted">
                      No printers detected. Run a rescan to discover printers.
                    </TableCell>
                  </TableRow>
                )}
                {printers.map((printer) => (
                  <TableRow
                    key={printer.cupsName}
                    className="border-b border-arch-border-default/50 hover:bg-arch-surface-tertiary transition-colors"
                  >
                    <TableCell className="text-arch-text-primary">{printer.cupsName}</TableCell>
                    <TableCell className="text-arch-text-secondary text-sm">
                      {printer.model}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-arch-text-secondary">
                      {printer.cupsName}
                    </TableCell>
                    <TableCell>
                      <PrinterStatusPill status={printer.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {printer.isRegistered ? (
                        <form action={unregisterAction.bind(null, printer.dbId)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-xs font-medium text-red-600 border-red-200/50 hover:bg-red-50/70"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Unregister
                          </Button>
                        </form>
                      ) : (
                        <RegisterPrinterForm
                          cupsName={printer.cupsName}
                          name={printer.cupsName}
                          model={printer.model}
                          connectionType={printer.connectionType}
                          vendorId={printer.vendorId}
                          productId={printer.productId}
                          devicePath={printer.devicePath}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </div>

        {/* ────────── Right Panel: Print Queue ────────── */}
        <div className="space-y-4">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex items-center justify-between">
              <h3 className="font-medium text-arch-text-primary flex items-center">
                <Clock className="w-4 h-4 mr-2 text-arch-text-muted" />
                Print Queue
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-arch-text-muted">
                  {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                </span>
                <StatusFilter current={statusFilter} />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-arch-border-default hover:bg-transparent">
                  <TableHead className="text-arch-text-muted">Employee</TableHead>
                  <TableHead className="text-arch-text-muted">Department</TableHead>
                  <TableHead className="text-arch-text-muted">Status</TableHead>
                  <TableHead className="text-arch-text-muted">Queued At</TableHead>
                  <TableHead className="text-arch-text-muted">Printer</TableHead>
                  <TableHead className="text-right text-arch-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-arch-text-muted">
                      No print jobs found.
                    </TableCell>
                  </TableRow>
                )}
                {jobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className="border-b border-arch-border-default/50 hover:bg-arch-surface-tertiary transition-colors"
                  >
                    <TableCell className="text-arch-text-primary">{job.employee_name}</TableCell>
                    <TableCell className="text-arch-text-secondary text-sm">
                      {job.department_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <JobStatusPill status={job.status} />
                    </TableCell>
                    <TableCell className="text-arch-text-secondary text-sm">
                      {new Date(job.queued_at).toLocaleString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-arch-text-secondary text-sm">
                      {job.printer?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {job.status === 'queued' && (
                        <form action={cancelAction.bind(null, job.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-xs font-medium text-amber-600 border-amber-200/50 hover:bg-amber-50/70"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </form>
                      )}
                      {job.status === 'failed' && (
                        <form action={retryAction.bind(null, job.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-xs font-medium text-blue-600 border-blue-200/50 hover:bg-blue-50/70"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
