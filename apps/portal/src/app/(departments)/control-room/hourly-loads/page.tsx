import { createServerSupabaseClient } from '@repo/supabase/server'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { HourlyLoadCell } from './HourlyLoadCell'

export const metadata: Metadata = {
  title: 'Hourly Loads | Arch OS',
  description: 'Hourly load tracking for all active machines.',
}

const HOUR_COLUMNS = [
  'hour_01',
  'hour_02',
  'hour_03',
  'hour_04',
  'hour_05',
  'hour_06',
  'hour_07',
  'hour_08',
  'hour_09',
  'hour_10',
  'hour_11',
  'hour_12',
] as const

type HourlyLoadRow = {
  id: string
  load_date: string
  shift_type: string
  material_type: string
  hour_01: number
  hour_02: number
  hour_03: number
  hour_04: number
  hour_05: number
  hour_06: number
  hour_07: number
  hour_08: number
  hour_09: number
  hour_10: number
  hour_11: number
  hour_12: number
  total_loads: number
  machines:
    | {
        name: string
        machine_type: string
        bin_factor: number | null
      }[]
    | null
}

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: loads, error } = await supabase
    .from('hourly_loads')
    .select(
      `
      id,
      load_date,
      shift_type,
      material_type,
      hour_01, hour_02, hour_03, hour_04, hour_05, hour_06,
      hour_07, hour_08, hour_09, hour_10, hour_11, hour_12,
      total_loads,
      machines ( name, machine_type, bin_factor )
    `
    )
    .eq('load_date', new Date().toISOString().split('T')[0])
    .order('shift_type')
    .limit(50)

  if (error) {
    throw new Error(`Failed to load hourly loads: ${error.message}`)
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto py-6">
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">Hourly Loads & BCM Tracking</h2>
        <p className="text-arch-text-muted text-sm">
          Live load counts by hour and auto-calculated estimated BCM (Bank Cubic Meters). Use the +/
          − buttons in each hour cell to adjust counts.
        </p>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-[1200px]">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Machine</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Type</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Shift</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Material</TableHead>
                {HOUR_COLUMNS.map((_, i) => (
                  <TableHead key={i} className="px-2 py-3 font-semibold text-center">
                    H{String(i + 1).padStart(2, '0')}
                  </TableHead>
                ))}
                <TableHead className="px-4 py-3 font-semibold text-right">Loads</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right text-arch-accent-blue">
                  Bin Factor
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right text-[var(--accent-orange)]">
                  Est. BCM
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {loads && loads.length > 0 ? (
                loads.map((row: HourlyLoadRow) => {
                  const machine = row.machines?.[0]
                  const binFactor = machine?.bin_factor ?? 18.5 // Default if null
                  const bcm = row.total_loads * binFactor

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                    >
                      <TableCell className="px-4 py-3 font-medium text-arch-text-primary">
                        {machine?.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary">
                        {machine?.machine_type}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary capitalize">
                        {row.shift_type}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary">
                        {row.material_type}
                      </TableCell>
                      {HOUR_COLUMNS.map((col) => (
                        <TableCell key={col} className="px-1 py-2 text-center">
                          <HourlyLoadCell
                            id={row.id}
                            hourColumn={col}
                            value={row[col as keyof HourlyLoadRow] as number}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-3 text-right font-bold text-arch-text-primary">
                        {row.total_loads}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium text-arch-accent-blue">
                        {binFactor.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-bold text-[var(--accent-orange)]">
                        {bcm.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={19} className="px-4 py-8 text-center text-arch-text-muted">
                    No loads recorded for today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  )
}
