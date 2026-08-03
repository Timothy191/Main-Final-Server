import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { SecondaryButton } from '@repo/ui/SecondaryButton'
import { Input } from '@repo/ui/Input'
import { Drill, Clock, AlertTriangle, ClipboardList } from 'lucide-react'

interface DrillingReportsPageProps {
  params: Promise<{ department: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function DrillingReportsPage({
  params,
  searchParams,
}: DrillingReportsPageProps) {
  // Use params but specify "drilling" for dept context since this is the dedicated drilling directory
  await params
  const { from: fromParam, to: toParam } = await searchParams
  const { deptId, supabase } = await getDepartmentContext({
    department: 'drilling',
  })

  const to = toParam || new Date().toISOString().split('T')[0]
  const from = fromParam || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const { data: operations } = await supabase
    .from('drill_operations')
    .select(
      `
      id,
      machine_id,
      operation_date,
      open_hours,
      close_hours,
      total_hours,
      operator_name,
      block_drilled,
      holes,
      meters_drilled,
      delay_blasting,
      delay_no_operator,
      delay_natural,
      delay_tramming,
      delay_get,
      delay_mechanical,
      delay_electrical,
      delay_hydraulic,
      delay_scheduled_maintenance,
      delay_unscheduled_maintenance,
      delay_supply,
      delay_power,
      delay_other,
      status,
      machines!inner(name)
    `
    )
    .eq('department_id', deptId)
    .gte('operation_date', from)
    .lte('operation_date', to)
    .order('operation_date', { ascending: false })

  const totalMeters =
    operations?.reduce((sum, op) => sum + (Number(op.meters_drilled) || 0), 0) || 0
  const totalHoles = operations?.reduce((sum, op) => sum + (Number(op.holes) || 0), 0) || 0
  const totalHours = operations?.reduce((sum, op) => sum + (Number(op.total_hours) || 0), 0) || 0
  const totalDelays =
    operations?.reduce((sum, op) => {
      const production_delays =
        (Number(op.delay_blasting) || 0) +
        (Number(op.delay_no_operator) || 0) +
        (Number(op.delay_natural) || 0) +
        (Number(op.delay_tramming) || 0) +
        (Number(op.delay_get) || 0)
      const non_productional_delays =
        (Number(op.delay_supply) || 0) +
        (Number(op.delay_power) || 0) +
        (Number(op.delay_other) || 0)
      const engineering_delays =
        (Number(op.delay_mechanical) || 0) +
        (Number(op.delay_electrical) || 0) +
        (Number(op.delay_hydraulic) || 0) +
        (Number(op.delay_scheduled_maintenance) || 0) +
        (Number(op.delay_unscheduled_maintenance) || 0)
      return sum + production_delays + non_productional_delays + engineering_delays
    }, 0) || 0

  function formatDelay(minutes: number): string {
    if (!minutes || minutes === 0) return '—'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const csvRows = [
    [
      'Date',
      'Drill Rig',
      'Operator',
      'Block',
      'Hours Worked',
      'Holes Drilled',
      'Meters Drilled',
      'Prod Delays (min)',
      'Non-Prod Delays (min)',
      'Eng Delays (min)',
      'Status',
    ],
    ...(operations || []).map((op) => {
      const production_delays =
        (Number(op.delay_blasting) || 0) +
        (Number(op.delay_no_operator) || 0) +
        (Number(op.delay_natural) || 0) +
        (Number(op.delay_tramming) || 0) +
        (Number(op.delay_get) || 0)
      const non_productional_delays =
        (Number(op.delay_supply) || 0) +
        (Number(op.delay_power) || 0) +
        (Number(op.delay_other) || 0)
      const engineering_delays =
        (Number(op.delay_mechanical) || 0) +
        (Number(op.delay_electrical) || 0) +
        (Number(op.delay_hydraulic) || 0) +
        (Number(op.delay_scheduled_maintenance) || 0) +
        (Number(op.delay_unscheduled_maintenance) || 0)
      return [
        op.operation_date,
        (op.machines as unknown as { name: string } | undefined)?.name || 'Unknown',
        op.operator_name || '',
        op.block_drilled || '',
        op.total_hours ? op.total_hours.toFixed(2) : '',
        op.holes || 0,
        op.meters_drilled ? Number(op.meters_drilled).toFixed(2) : '',
        production_delays || 0,
        non_productional_delays || 0,
        engineering_delays || 0,
        op.status,
      ]
    }),
  ]

  const csvContent = csvRows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">Drilling Production Report</h2>
          <p className="text-sm text-arch-text-muted mt-1">
            Drilling, holes, and operating hours summary report
          </p>
        </div>
        <SecondaryButton variant="rounded-lg" size="sm" asChild>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
            download={`drilling-report-${from}-to-${to}.csv`}
          >
            Download CSV
          </a>
        </SecondaryButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <Drill className="w-4 h-4 text-accent-green" />
            <p className="text-arch-text-muted text-sm font-medium">Total Meters Drilled</p>
          </div>
          <p className="text-2xl font-semibold text-accent-green mt-2">{totalMeters.toFixed(1)}m</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-arch-accent-charcoal" />
            <p className="text-arch-text-muted text-sm font-medium">Total Holes Drilled</p>
          </div>
          <p className="text-2xl font-semibold text-arch-accent-charcoal mt-2">{totalHoles}</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <p className="text-arch-text-muted text-sm font-medium">Total Operating Hours</p>
          </div>
          <p className="text-2xl font-semibold text-cyan-400 mt-2">{totalHours.toFixed(1)}h</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-blue" />
            <p className="text-arch-text-muted text-sm font-medium">Total Delays</p>
          </div>
          <p className="text-2xl font-semibold text-accent-blue mt-2">{formatDelay(totalDelays)}</p>
        </GlassCard>
      </div>

      {/* Date Filter */}
      <GlassCard>
        <form method="GET" className="flex items-end gap-4">
          <div className="flex-1 max-w-[200px]">
            <label className="block text-sm text-arch-text-muted mb-1">From</label>
            <Input type="date" name="from" defaultValue={from} className="px-4 py-2" />
          </div>
          <div className="flex-1 max-w-[200px]">
            <label className="block text-sm text-arch-text-muted mb-1">To</label>
            <Input type="date" name="to" defaultValue={to} className="px-4 py-2" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-arch-surface-tertiary text-arch-text-primary text-sm font-medium hover:bg-arch-surface-tertiary transition-colors"
          >
            Update
          </button>
        </form>
      </GlassCard>

      {/* Report Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Drill Rig
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Operator
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Block
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider text-right"
                >
                  Hours
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider text-right"
                >
                  Holes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider text-right"
                >
                  Meters
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider text-right"
                >
                  Delays
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider text-center"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {operations?.map((op) => {
                const production_delays =
                  (Number(op.delay_blasting) || 0) +
                  (Number(op.delay_no_operator) || 0) +
                  (Number(op.delay_natural) || 0) +
                  (Number(op.delay_tramming) || 0) +
                  (Number(op.delay_get) || 0)
                const non_productional_delays =
                  (Number(op.delay_supply) || 0) +
                  (Number(op.delay_power) || 0) +
                  (Number(op.delay_other) || 0)
                const engineering_delays =
                  (Number(op.delay_mechanical) || 0) +
                  (Number(op.delay_electrical) || 0) +
                  (Number(op.delay_hydraulic) || 0) +
                  (Number(op.delay_scheduled_maintenance) || 0) +
                  (Number(op.delay_unscheduled_maintenance) || 0)
                const totalOpDelays =
                  production_delays + non_productional_delays + engineering_delays
                return (
                  <tr key={op.id} className="hover:bg-arch-surface-tertiary transition-colors">
                    <td className="px-6 py-4 text-arch-text-primary text-sm">
                      {op.operation_date}
                    </td>
                    <td className="px-6 py-4 text-arch-text-secondary text-sm">
                      {(op.machines as unknown as { name: string } | undefined)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-arch-text-secondary text-sm">
                      {op.operator_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-arch-text-secondary text-sm">
                      {op.block_drilled || '—'}
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm text-right">
                      {op.total_hours ? op.total_hours.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm text-right">
                      {op.holes || 0}
                    </td>
                    <td className="px-6 py-4 text-accent-green text-sm text-right font-medium">
                      {op.meters_drilled ? Number(op.meters_drilled).toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-4 text-accent-blue text-sm text-right">
                      {formatDelay(totalOpDelays)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          op.status === 'active' || op.status === 'completed'
                            ? 'bg-emerald-50/70 border-emerald-200/50 text-emerald-700'
                            : op.status === 'maintenance'
                              ? 'bg-amber-50/70 border-amber-200/50 text-amber-700'
                              : 'bg-red-50/70 border-red-200/50 text-red-700'
                        }`}
                      >
                        {op.status === 'active' && (
                          <span className="badge-pulse-dot bg-emerald-500" />
                        )}
                        {op.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(!operations || operations.length === 0) && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-arch-text-muted text-sm">
                    No drilling data found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
