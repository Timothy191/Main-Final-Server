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
import { ClipboardList, AlertOctagon, ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Engineering Notes | Control Room | Arch OS',
  description: 'Engineering logs, equipment issues, and maintenance notes.',
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
  const { deptId } = await getDepartmentContext({ department: 'control-room' })
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch engineering notes
  const { data: notes, error } = await supabase
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
    .eq('department_id', deptId)
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to load engineering notes: ${error.message}`)
  }

  const typedNotes = (notes || []) as unknown as EngineeringNoteRow[]

  // Calculate statistics
  const totalNotes = typedNotes.length
  const criticalHighCount = typedNotes.filter(
    (n) => n.severity.toLowerCase() === 'critical' || n.severity.toLowerCase() === 'high'
  ).length
  const unresolvedCount = typedNotes.filter((n) => n.status.toLowerCase() !== 'resolved').length

  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase()
    if (s === 'critical') {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30">
          Critical
        </Badge>
      )
    }
    if (s === 'high') {
      return (
        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 hover:bg-orange-500/30">
          High
        </Badge>
      )
    }
    if (s === 'medium') {
      return (
        <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30">
          Medium
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30 hover:bg-blue-400/30">
        Low
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'resolved') {
      return (
        <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30">
          Resolved
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30 animate-pulse">
        Open
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">
          Engineering Notes & Shift Logs
        </h2>
        <p className="text-arch-text-muted text-sm">
          Tracking technical challenges, mechanical issues, status reports, and handovers.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-400/10 rounded-lg text-blue-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Total Notes
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">{totalNotes}</h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-lg text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Critical / High Issues
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {criticalHighCount}
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400/10 rounded-lg text-yellow-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Unresolved Issues
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {unresolvedCount}
              </h4>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Engineering Notes Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Details</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Machine</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Shift</TableHead>
                <TableHead className="px-4 py-3 text-center">Severity</TableHead>
                <TableHead className="px-4 py-3 text-center">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {typedNotes.length > 0 ? (
                typedNotes.map((row) => {
                  const machineData = Array.isArray(row.machine) ? row.machine[0] : row.machine

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                    >
                      <TableCell className="px-4 py-3 max-w-md">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-arch-text-primary">
                              {row.issue_type}
                            </span>
                          </div>
                          <p className="text-xs text-arch-text-secondary mt-1">{row.description}</p>
                          {row.action_taken && (
                            <div className="mt-2 text-xs bg-white/5 p-2 rounded border border-white/5">
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
