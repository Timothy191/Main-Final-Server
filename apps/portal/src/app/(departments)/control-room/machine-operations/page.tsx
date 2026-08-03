import { createServerSupabaseClient } from '@repo/supabase/server'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import { Badge } from '@repo/ui/components/ui/badge'
import { Cpu, Clock, MapPin, User, Activity } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Machine Operations | Control Room | Arch OS',
  description: 'Live machine operations tracking and monitoring.',
}

interface MachineOperationRow {
  id: string
  shift_date: string
  shift_type: string
  start_time: string
  end_time: string | null
  hours_worked: number | null
  machine: { name: string; machine_type: string } | { name: string; machine_type: string }[] | null
  site: { name: string } | { name: string }[] | null
  operator: { full_name: string } | { full_name: string }[] | null
}

export default async function MachineOperationsPage() {
  const { deptId } = await getDepartmentContext({ department: 'control-room' })
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch machine operations with joined names
  const { data: operations, error } = await supabase
    .from('machine_operations')
    .select(
      `
      id,
      shift_date,
      shift_type,
      start_time,
      end_time,
      hours_worked,
      machine:machines(name, machine_type),
      site:sites(name),
      operator:employees(full_name)
    `
    )
    .eq('department_id', deptId)
    .order('shift_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to load machine operations: ${error.message}`)
  }

  const typedOps = (operations || []) as unknown as MachineOperationRow[]

  // Calculate statistics
  const activeOps = typedOps.filter((op) => !op.end_time)
  const activeRunsCount = activeOps.length
  const totalLoggedHours = typedOps.reduce((sum, op) => sum + (op.hours_worked || 0), 0)

  const uniqueOperators = new Set<string>()
  activeOps.forEach((op) => {
    const opData = Array.isArray(op.operator) ? op.operator[0] : op.operator
    if (opData?.full_name) uniqueOperators.add(opData.full_name)
  })
  const activeOperatorsCount = uniqueOperators.size

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">Machine Operations</h2>
        <p className="text-arch-text-muted text-sm">
          Live monitoring of all operating machinery on shift. View active runs, operator logs, and
          cycle times.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-green/10 rounded-lg text-accent-green">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Operations
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {activeRunsCount}
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-400/10 rounded-lg text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Total Logged Hours
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {totalLoggedHours.toFixed(1)}h
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-400/10 rounded-lg text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Operators
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {activeOperatorsCount}
              </h4>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Operations Grid */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Machine</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Operator</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Location / Site</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Shift</TableHead>
                <TableHead className="px-4 py-3 text-center">Start Time</TableHead>
                <TableHead className="px-4 py-3 text-center">Hours Worked</TableHead>
                <TableHead className="px-4 py-3 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {typedOps.length > 0 ? (
                typedOps.map((row) => {
                  const machineData = Array.isArray(row.machine) ? row.machine[0] : row.machine
                  const siteData = Array.isArray(row.site) ? row.site[0] : row.site
                  const operatorData = Array.isArray(row.operator) ? row.operator[0] : row.operator

                  const isRunning = !row.end_time

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-arch-text-secondary" />
                          <div>
                            <span className="font-semibold text-arch-text-primary block">
                              {machineData?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-arch-text-muted">
                              {machineData?.machine_type || 'Machinery'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary font-medium">
                        {operatorData?.full_name || 'No Operator'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-arch-text-muted" />
                          <span>{siteData?.name || 'Not assigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-arch-text-secondary">
                            {row.shift_date}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                              row.shift_type === 'day'
                                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                                : 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20'
                            }`}
                          >
                            {row.shift_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center text-arch-text-secondary font-mono text-xs">
                        {new Date(row.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {isRunning ? (
                          <span className="text-xs text-accent-green font-semibold flex items-center justify-center gap-1">
                            <Activity className="w-3 h-3 animate-pulse" />
                            In Progress
                          </span>
                        ) : (
                          <span className="font-mono text-arch-text-primary font-bold">
                            {row.hours_worked?.toFixed(1) || '0.0'}h
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {isRunning ? (
                          <Badge className="bg-accent-green/20 text-accent-green hover:bg-accent-green/30 border-accent-green/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-white/5 text-arch-text-muted border-white/10 hover:bg-white/10">
                            Completed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-arch-text-muted">
                    No machine operations recorded for this department.
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
