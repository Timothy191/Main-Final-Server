import { GlassCard } from '@repo/ui/GlassCard'
import { History, Printer, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { getPrintHistory } from '../actions'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-600',
  pending: 'bg-amber-500/10 text-amber-600',
  printing: 'bg-blue-500/10 text-blue-600',
  failed: 'bg-rose-500/10 text-rose-600 animate-pulse',
  're-printed': 'bg-violet-500/10 text-violet-600',
}

const TYPE_STYLES: Record<string, string> = {
  personnel: 'bg-blue-500/10 text-blue-600',
  visitor: 'bg-emerald-500/10 text-emerald-600',
  contractor: 'bg-amber-500/10 text-amber-600',
  temporary: 'bg-violet-500/10 text-violet-600',
}

const STATUS_FILTERS = ['All', 'completed', 'pending', 'printing', 'failed', 're-printed']

export default async function PrintHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>
}) {
  const { status } = (await searchParams) ?? {}
  const { prints } = await getPrintHistory(status)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Print History</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Historical record of badge print jobs, status and reprints
        </p>
      </div>

      {/* Status filters */}
      <GlassCard className="flex items-center gap-2 overflow-x-auto">
        <History className="w-4 h-4 text-arch-text-muted shrink-0" />
        {STATUS_FILTERS.map((option) => {
          const params = new URLSearchParams()
          if (option !== 'All') params.set('status', option)
          return (
            <Link
              key={option}
              href={`?${params.toString()}`}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 ${
                (status || 'All') === option
                  ? 'bg-[var(--text-heading)] text-white border-transparent'
                  : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
              }`}
            >
              {option.replace('-', ' ')}
            </Link>
          )
        })}
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {prints.length === 0 ? (
          <div className="p-12 text-center">
            <Printer className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <p className="text-sm text-arch-text-muted">No print jobs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Printed At</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Card Type</th>
                  <th className="px-4 py-3">Printer</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {prints.map((print) => (
                  <tr key={print.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 text-arch-text-muted font-mono text-[10px]">
                      {print.printed_at}
                    </td>
                    <td className="px-4 py-3 font-medium text-arch-text-primary">
                      {print.employee_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TYPE_STYLES[print.card_type] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                      >
                        {print.card_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">{print.printer_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[print.print_status] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                      >
                        {print.print_status === 'completed' && (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        )}
                        {print.print_status === 'failed' && (
                          <AlertTriangle className="w-2.5 h-2.5" />
                        )}
                        {print.print_status === 're-printed' && (
                          <RefreshCw className="w-2.5 h-2.5" />
                        )}
                        {print.print_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
