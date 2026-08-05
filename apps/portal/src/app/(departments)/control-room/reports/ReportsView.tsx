'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import {
  FileText,
  Download,
  Calendar,
  User,
  EyeOff,
  Clock,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateReportAssignedShift } from '../actions'

const SHIFT_CYCLE_DAYS = 9
const ANCHOR_DATE = new Date('2026-01-01T00:00:00Z')

// Calculate scheduled shift based on roster rules:
// Shift A: 3 days (Day), 3 days (Night), 3 days (Off)
// Shift B: 3 days (Off), 3 days (Day), 3 days (Night)
// Shift C: 3 days (Night), 3 days (Off), 3 days (Day)
export function getScheduledShift(
  dateStr: string,
  shiftType: 'day' | 'night' | null
): 'Shift A' | 'Shift B' | 'Shift C' {
  // Use midday to avoid timezone edge issues
  const date = new Date(dateStr + 'T12:00:00Z')
  const diffTime = date.getTime() - ANCHOR_DATE.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const cycleDay = ((diffDays % SHIFT_CYCLE_DAYS) + SHIFT_CYCLE_DAYS) % SHIFT_CYCLE_DAYS
  const isNight = shiftType === 'night'

  if (cycleDay >= 0 && cycleDay <= 2) {
    return isNight ? 'Shift C' : 'Shift A'
  } else if (cycleDay >= 3 && cycleDay <= 5) {
    return isNight ? 'Shift A' : 'Shift B'
  } else {
    return isNight ? 'Shift B' : 'Shift C'
  }
}

interface GeneratedReportRow {
  id: string
  generated_at: string
  pdf_url: string | null
  report_date: string
  shift_type: string | null
  report_data: Record<string, string | number | boolean | null | undefined>
  creator: { full_name: string } | { full_name: string }[] | null
  template: { name: string } | { name: string }[] | null
}

interface ReportsViewProps {
  reports: GeneratedReportRow[]
}

export function ReportsView({ reports }: ReportsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL')

  // Interactive schedule finder states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedReportType, setSelectedReportType] = useState('ALL')

  // Get unique report types for the filter dropdown
  const reportTypes = Array.from(
    new Set(
      reports.map(
        (r) =>
          (Array.isArray(r.template) ? r.template[0]?.name : r.template?.name) ||
          'Operations Summary Report'
      )
    )
  )

  const [lookupDate, setLookupDate] = useState(() => new Date().toISOString().split('T')[0])
  const [lookupShift, setLookupShift] = useState<'day' | 'night'>('day')
  const [lookupResult, setLookupResult] = useState<string>('')

  // Calculate current shift
  const [currentShiftInfo, setCurrentShiftInfo] = useState({
    activeDay: '',
    activeNight: '',
    activeOff: '',
    isDaytime: true,
  })

  // Recalculate lookups & current shifts on load or date change
  useEffect(() => {
    if (lookupDate) {
      const res = getScheduledShift(lookupDate, lookupShift)
      setLookupResult(res)
    }
  }, [lookupDate, lookupShift])

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const isDaytime = hour >= 6 && hour < 18

    const diffTime = now.getTime() - ANCHOR_DATE.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const cycleDay = ((diffDays % SHIFT_CYCLE_DAYS) + SHIFT_CYCLE_DAYS) % SHIFT_CYCLE_DAYS

    let activeDay = ''
    let activeNight = ''
    let activeOff = ''

    if (cycleDay >= 0 && cycleDay <= 2) {
      activeDay = 'Shift A'
      activeNight = 'Shift C'
      activeOff = 'Shift B'
    } else if (cycleDay >= 3 && cycleDay <= 5) {
      activeDay = 'Shift B'
      activeNight = 'Shift A'
      activeOff = 'Shift C'
    } else {
      activeDay = 'Shift C'
      activeNight = 'Shift B'
      activeOff = 'Shift A'
    }

    setCurrentShiftInfo({
      activeDay,
      activeNight,
      activeOff,
      isDaytime,
    })
  }, [])

  const handleShiftChange = async (reportId: string, shift: 'Shift A' | 'Shift B' | 'Shift C') => {
    startTransition(async () => {
      try {
        await updateReportAssignedShift(reportId, shift)
        toast.success(`Shift updated to ${shift} successfully`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update report shift')
      }
    })
  }

  // Get dynamic/assigned shift for rendering
  const getAssignedShift = (row: GeneratedReportRow) => {
    // If manually overridden in report_data
    if (row.report_data?.assigned_shift) {
      return {
        name: row.report_data.assigned_shift as 'Shift A' | 'Shift B' | 'Shift C',
        isManual: true,
      }
    }
    // Calculate scheduled shift based on roster schedule
    const sched = getScheduledShift(row.report_date, row.shift_type as 'day' | 'night' | null)
    return {
      name: sched,
      isManual: false,
    }
  }

  // Filter reports
  const filteredReports = reports.filter((row) => {
    const templateData = Array.isArray(row.template) ? row.template[0] : row.template
    const creatorData = Array.isArray(row.creator) ? row.creator[0] : row.creator
    const reportName = templateData?.name || 'Operations Summary Report'
    const reportType = reportName
    const creatorName = creatorData?.full_name || 'System Auto-Compile'

    // Date filtering
    const reportDate = new Date(row.report_date)
    const matchesStartDate = !startDate || reportDate >= new Date(startDate)
    const matchesEndDate = !endDate || reportDate <= new Date(endDate + 'T23:59:59.999')

    // Text search
    const matchesSearch =
      reportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.report_date.includes(searchQuery)

    // Shift filter
    const assignedInfo = getAssignedShift(row)
    const matchesShift = selectedShiftFilter === 'ALL' || assignedInfo.name === selectedShiftFilter

    // Report type filter
    const matchesType = selectedReportType === 'ALL' || reportType === selectedReportType

    return matchesSearch && matchesShift && matchesType && matchesStartDate && matchesEndDate
  })

  // Format cycle schedule for visual map
  const getRosterDayInfo = (offsetDays: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const dateStr = d.toISOString().split('T')[0] ?? ''

    const diffTime = d.getTime() - ANCHOR_DATE.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const cycleDay = ((diffDays % SHIFT_CYCLE_DAYS) + SHIFT_CYCLE_DAYS) % SHIFT_CYCLE_DAYS

    let dayShift = ''
    let nightShift = ''
    if (cycleDay >= 0 && cycleDay <= 2) {
      dayShift = 'Shift A'
      nightShift = 'Shift C'
    } else if (cycleDay >= 3 && cycleDay <= 5) {
      dayShift = 'Shift B'
      nightShift = 'Shift A'
    } else {
      dayShift = 'Shift C'
      nightShift = 'Shift B'
    }

    return {
      label: offsetDays === 0 ? 'Today' : offsetDays === 1 ? 'Tomorrow' : dateStr.slice(5),
      dayShift,
      nightShift,
    }
  }

  const rosterMap = Array.from({ length: 5 }, (_, i) => getRosterDayInfo(i))

  const renderReportSummary = (
    data: Record<string, string | number | boolean | null | undefined>
  ) => {
    if (!data || typeof data !== 'object') return null
    const summaries: string[] = []
    if (data.total_tonnage) summaries.push(`Tonnage: ${data.total_tonnage}t`)
    if (data.tonnes) summaries.push(`Tonnage: ${data.tonnes}t`)
    if (data.loads) summaries.push(`Loads: ${data.loads}`)
    if (data.active_machines) summaries.push(`Machines: ${data.active_machines}`)
    if (data.delays_count !== undefined) summaries.push(`Delays: ${data.delays_count}`)

    if (summaries.length === 0) {
      Object.keys(data)
        .slice(0, 2)
        .forEach((key) => {
          const val = data[key]
          if (typeof val === 'number' || typeof val === 'string') {
            summaries.push(`${key.replace(/_/g, ' ')}: ${val}`)
          }
        })
    }

    if (summaries.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {summaries.map((s, idx) => (
          <span
            key={idx}
            className="text-[10px] bg-white/5 text-arch-text-secondary px-1.5 py-0.5 rounded border border-white/5 font-mono"
          >
            {s}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shift Roster Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Active Roster Status */}
        <GlassCard className="p-5 flex flex-col justify-between bg-gradient-to-br from-arch-surface-secondary to-arch-surface-tertiary">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-bold text-arch-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-arch-accent-blue" />
                Live Shift Status
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-arch-border/40 pb-2">
                <span className="text-xs text-arch-text-secondary">Day Shift (06:00 - 18:00):</span>
                <span
                  className={`text-sm font-extrabold ${
                    currentShiftInfo.isDaytime
                      ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.2)]'
                      : 'text-arch-text-primary'
                  }`}
                >
                  {currentShiftInfo.activeDay || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-arch-border/40 pb-2">
                <span className="text-xs text-arch-text-secondary">
                  Night Shift (18:00 - 06:00):
                </span>
                <span
                  className={`text-sm font-extrabold ${
                    !currentShiftInfo.isDaytime
                      ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.2)]'
                      : 'text-arch-text-primary'
                  }`}
                >
                  {currentShiftInfo.activeNight || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-arch-text-secondary">Off Duty:</span>
                <span className="text-xs font-semibold text-arch-text-muted">
                  {currentShiftInfo.activeOff || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-arch-border/40 flex items-center gap-2 text-[11px] text-arch-text-muted">
            <Info className="w-3.5 h-3.5 text-arch-text-muted shrink-0" />
            <span>Cycle: 3 Days On, 3 Nights On, 3 Days Off.</span>
          </div>
        </GlassCard>

        {/* 5-Day Visual Schedule Map */}
        <GlassCard className="p-5 bg-gradient-to-br from-arch-surface-secondary to-arch-surface-tertiary col-span-1 lg:col-span-2">
          <h3 className="text-sm font-bold text-arch-text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-arch-accent-blue" />
            Shift Rotation Map
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {rosterMap.map((day, idx) => (
              <div
                key={idx}
                className="bg-arch-surface-tertiary/60 border border-arch-border/50 rounded-lg p-2.5 flex flex-col items-center justify-between text-center gap-2 hover:bg-arch-surface-tertiary transition-colors"
              >
                <span className="text-xs font-bold text-arch-text-primary block border-b border-arch-border/40 w-full pb-1">
                  {day.label}
                </span>
                <div className="space-y-1.5 w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-arch-text-muted uppercase tracking-wider">
                      Day
                    </span>
                    <span className="text-xs font-extrabold text-yellow-400">{day.dayShift}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-arch-text-muted uppercase tracking-wider">
                      Night
                    </span>
                    <span className="text-xs font-extrabold text-indigo-400">{day.nightShift}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Lookup Form */}
          <div className="mt-4 pt-3.5 border-t border-arch-border/40 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-semibold text-arch-text-secondary">
              Check scheduled shift on date:
            </span>
            <div className="flex items-center gap-2.5">
              <input
                type="date"
                value={lookupDate}
                onChange={(e) => setLookupDate(e.target.value)}
                className="bg-arch-surface-tertiary border border-arch-border rounded px-2.5 py-1 text-xs text-arch-text-primary outline-none focus:border-arch-accent-blue"
              />
              <select
                value={lookupShift}
                onChange={(e) => setLookupShift(e.target.value as 'day' | 'night')}
                className="bg-arch-surface-tertiary border border-arch-border rounded px-2.5 py-1 text-xs text-arch-text-primary outline-none focus:border-arch-accent-blue cursor-pointer"
              >
                <option value="day">Day (6-18)</option>
                <option value="night">Night (18-6)</option>
              </select>
              <ChevronRight className="w-4 h-4 text-arch-text-muted" />
              <span className="text-xs font-extrabold text-arch-accent-blue bg-arch-accent-blue/10 border border-arch-accent-blue/20 px-2.5 py-1 rounded">
                {lookupResult}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search controls */}
      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-arch-surface-secondary/50 border border-arch-border/40">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arch-text-muted" />
          <input
            type="text"
            placeholder="Search reports by date or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-arch-surface-tertiary border border-arch-border rounded-md pl-9 pr-4 py-2 text-sm text-arch-text-primary placeholder:text-arch-text-muted focus:outline-none focus:border-arch-accent-blue"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-arch-text-muted shrink-0" />
            <span className="text-xs text-arch-text-secondary font-medium whitespace-nowrap">
              Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-arch-surface-tertiary border border-arch-border rounded px-2.5 py-1.5 text-xs text-arch-text-primary outline-none focus:border-arch-accent-blue cursor-pointer"
              title="Start Date"
            />
            <span className="text-arch-text-muted text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-arch-surface-tertiary border border-arch-border rounded px-2.5 py-1.5 text-xs text-arch-text-primary outline-none focus:border-arch-accent-blue cursor-pointer"
              title="End Date"
            />
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-arch-text-muted shrink-0" />
            <span className="text-xs text-arch-text-secondary font-medium whitespace-nowrap">
              Report Type:
            </span>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="bg-arch-surface-tertiary border border-arch-border rounded px-3 py-1.5 text-xs text-arch-text-primary outline-none focus:border-arch-accent-blue cursor-pointer font-semibold"
            >
              <option value="ALL">All Types</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-arch-text-muted shrink-0" />
            <span className="text-xs text-arch-text-secondary font-medium whitespace-nowrap">
              Filter by Assigned Shift:
            </span>
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="bg-arch-surface-tertiary border border-arch-border rounded px-3 py-1.5 text-xs text-arch-text-primary outline-none focus:border-arch-accent-blue cursor-pointer font-semibold"
            >
              <option value="ALL">All Shifts</option>
              <option value="Shift A">Shift A</option>
              <option value="Shift B">Shift B</option>
              <option value="Shift C">Shift C</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Reports Grid/Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Report Info</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Compiled Summary</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-center">Shift Details</TableHead>
                <TableHead className="px-4 py-3 text-center">Assigned Shift</TableHead>
                <TableHead className="px-4 py-3 text-center">Generated By</TableHead>
                <TableHead className="px-4 py-3 text-right">Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {filteredReports.length > 0 ? (
                filteredReports.map((row) => {
                  const templateData = Array.isArray(row.template) ? row.template[0] : row.template
                  const creatorData = Array.isArray(row.creator) ? row.creator[0] : row.creator
                  const reportName = templateData?.name || 'Operations Summary Report'

                  const shiftInfo = getAssignedShift(row)

                  return (
                    <TableRow
                      key={row.id}
                      className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-400/10 rounded text-blue-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-arch-text-primary block">
                              {reportName}
                            </span>
                            <span className="text-xs text-arch-text-muted">
                              Compiled: {new Date(row.generated_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {renderReportSummary(row.report_data)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 text-xs font-semibold text-arch-text-secondary">
                            <Calendar className="w-3.5 h-3.5 text-arch-text-muted" />
                            <span>{row.report_date}</span>
                          </div>
                          {row.shift_type && (
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded mt-1.5 ${
                                row.shift_type === 'day'
                                  ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                                  : 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20'
                              }`}
                            >
                              {row.shift_type}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          <select
                            value={shiftInfo.name}
                            disabled={isPending}
                            onChange={(e) =>
                              handleShiftChange(
                                row.id,
                                e.target.value as 'Shift A' | 'Shift B' | 'Shift C'
                              )
                            }
                            className="bg-transparent border border-transparent hover:border-arch-border/50 hover:bg-arch-surface-tertiary focus:bg-arch-surface-tertiary focus:border-arch-accent-blue rounded px-2 py-1 text-xs text-arch-text-primary focus:text-arch-text-primary outline-none transition-all cursor-pointer font-bold"
                          >
                            <option
                              value="Shift A"
                              className="bg-arch-surface-secondary text-arch-text-primary"
                            >
                              Shift A
                            </option>
                            <option
                              value="Shift B"
                              className="bg-arch-surface-secondary text-arch-text-primary"
                            >
                              Shift B
                            </option>
                            <option
                              value="Shift C"
                              className="bg-arch-surface-secondary text-arch-text-primary"
                            >
                              Shift C
                            </option>
                          </select>
                          <span className="text-[9px] text-arch-text-muted">
                            {shiftInfo.isManual ? '(Manual)' : '(Auto)'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-arch-text-secondary font-medium">
                          <User className="w-3.5 h-3.5 text-arch-text-muted" />
                          <span>{creatorData?.full_name || 'System Auto-Compile'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {row.pdf_url ? (
                          <a
                            href={row.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded font-medium transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-arch-text-muted px-2 py-1">
                            <EyeOff className="w-3.5 h-3.5 text-arch-text-muted" />
                            Unavailable
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-arch-text-muted">
                    No reports match the filter criteria.
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
