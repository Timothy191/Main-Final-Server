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
import { ClipboardList, AlertOctagon, ShieldAlert, Wrench, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Engineering Notes & Breakdowns | Control Room | Arch OS',
  description: 'Live engineering breakdown feeds, equipment issues, and shift maintenance logs.',
}

interface BreakdownRow {
  id: string
  machine_name: string
  machine_type: string
  reason: string
  priority: string | null
  status: string
  created_at: string
  downtime_hours?: number | null
}

interface EngineeringNoteRow {
  id: string
  note_date: string
  shift_type: string
  issue_type: string
  severity: string
  status: string
  description: string
  action_taken: string
  requires_follow_up: boolean
  resolved_at: string | null
  machine: { name: string; machine_type: string } | { name: string; machine_type: string }[] | null
}

export default async function EngineeringNotesPage() {
  await getDepartmentContext({ department: 'control-room' })
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Fetch live equipment breakdowns captured by Engineering
  const { data: breakdownsData } = await supabase
    .from('breakdowns')
    .select('id, machine_name, machine_type, reason, priority, status, created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  const breakdowns = (breakdownsData || []) as BreakdownRow[]

  // 2. Fetch engineering shift notes & handovers
  const { data: notesData } = await supabase
    .from('engineering_notes')
    .select(
      `
      id,
      note_date,
      shift_type,
      issue_type,
      severity,
      status,
      description,
      action_taken,
      requires_follow_up,
      resolved_at,
      machine:machines(name, machine_type)
    `
    )
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  const notes = (notesData || []) as unknown as EngineeringNoteRow[]

  // Statistics
  const activeBreakdowns = breakdowns.filter((b) => b.status.toLowerCase() === 'active').length
  const criticalBreakdowns = breakdowns.filter(
    (b) =>
      (b.priority ?? '').toLowerCase() === 'high' || (b.priority ?? '').toLowerCase() === 'critical'
  ).length
  const totalNotes = notes.length
  const unresolvedNotes = notes.filter((n) => n.status.toLowerCase() !== 'resolved').length

  const getPriorityBadge = (priority: string | null) => {
    const p = (priority || 'medium').toLowerCase()
    if (p === 'critical' || p === 'high') {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30 font-semibold">
          High / Critical
        </Badge>
      )
    }
    if (p === 'medium') {
      return (
        <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30 font-semibold">
          Medium
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 hover:bg-blue-400/30 font-semibold">
        Low
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase()
    if (s === 'critical' || s === 'high') {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30 font-semibold">
          {severity}
        </Badge>
      )
    }
    if (s === 'medium') {
      return (
        <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30 font-semibold">
          Medium
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 hover:bg-blue-400/30 font-semibold">
        Low
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'resolved' || s === 'completed') {
      return (
        <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30 font-semibold">
          Resolved
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30 animate-pulse font-semibold">
        Active
      </Badge>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary flex items-center gap-2">
          <Wrench className="w-6 h-6 text-accent-amber" />
          Engineering Breakdowns & Dispatch Notes
        </h2>
        <p className="text-arch-text-muted text-sm mt-1">
          Real-time preview of active equipment breakdowns captured by Engineering and shift
          maintenance logs.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-lg text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Breakdowns
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {activeBreakdowns}
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-500">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Critical Priority Faults
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {criticalBreakdowns}
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-400/10 rounded-lg text-blue-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Total Shift Notes
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">{totalNotes}</h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400/10 rounded-lg text-yellow-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Open Maintenance Tasks
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {unresolvedNotes}
              </h4>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* SECTION 1: Live Captured Engineering Breakdowns Preview */}
      <GlassCard className="overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-arch-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-arch-text-primary uppercase tracking-wider">
              Engineering Breakdown Feed (Captured Equipment Faults)
            </h3>
          </div>
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            {breakdowns.length} Breakdowns Logged
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-xs uppercase tracking-wider">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Machine / Equipment</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Breakdown Reason / Fault</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Priority</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Status</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right">Logged At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {breakdowns.length > 0 ? (
                breakdowns.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-arch-border/40 hover:bg-arch-accent-charcoal/10 transition-colors"
                  >
                    <TableCell className="px-4 py-3 font-medium">
                      <div>
                        <span className="font-bold text-arch-text-primary block">
                          {row.machine_name}
                        </span>
                        <span className="text-xs text-arch-text-muted">{row.machine_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-md">
                      <p className="text-arch-text-primary text-xs font-medium leading-relaxed">
                        {row.reason}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {getPriorityBadge(row.priority)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      {getStatusBadge(row.status)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-xs font-mono text-arch-text-muted">
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-8 text-center text-arch-text-muted">
                    No active equipment breakdowns currently logged by Engineering.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* SECTION 2: Shift Maintenance & Engineering Notes Log */}
      <GlassCard className="overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-arch-border/40 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-arch-text-primary uppercase tracking-wider">
              Shift Maintenance & Handover Logs
            </h3>
          </div>
          <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/20">
            {notes.length} Notes Logged
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-xs uppercase tracking-wider">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Details / Issue</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Machine</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Shift Date</TableHead>
                <TableHead className="px-4 py-3 text-center">Severity</TableHead>
                <TableHead className="px-4 py-3 text-center">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {notes.length > 0 ? (
                notes.map((row) => {
                  const machineData = Array.isArray(row.machine) ? row.machine[0] : row.machine

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-arch-border/40 hover:bg-arch-accent-charcoal/10 transition-colors"
                    >
                      <TableCell className="px-4 py-3 max-w-md">
                        <div>
                          <span className="font-bold text-arch-text-primary block">
                            {row.issue_type}
                          </span>
                          <p className="text-xs text-arch-text-secondary mt-1">{row.description}</p>
                          {row.action_taken && (
                            <div className="mt-2 text-xs bg-black/5 p-2 rounded border border-arch-border/30">
                              <span className="text-arch-text-muted font-semibold block uppercase text-[10px]">
                                Action Taken:
                              </span>
                              <span className="text-arch-text-secondary font-medium">
                                {row.action_taken}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {machineData ? (
                          <div>
                            <span className="font-semibold text-arch-text-primary block">
                              {machineData.name}
                            </span>
                            <span className="text-xs text-arch-text-muted">
                              {machineData.machine_type}
                            </span>
                          </div>
                        ) : (
                          <span className="text-arch-text-muted text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold text-arch-text-secondary">
                            {row.note_date}
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
                      <TableCell className="px-4 py-3 text-center">
                        {getSeverityBadge(row.severity)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        {getStatusBadge(row.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {row.requires_follow_up ? (
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/20 hover:bg-red-500/30">
                            Required
                          </Badge>
                        ) : (
                          <span className="text-arch-text-muted text-xs">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-arch-text-muted">
                    No engineering notes logged for this department.
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
