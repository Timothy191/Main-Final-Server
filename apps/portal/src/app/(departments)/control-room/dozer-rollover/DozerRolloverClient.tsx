'use client'

import { useState } from 'react'
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
import { Truck, Calculator, Layers, Search, Filter } from 'lucide-react'

export interface DozerRolloverRecord {
  id: string
  machineId: string
  machineName: string
  siteName: string
  operatorName: string
  shiftDate: string
  shiftType: 'day' | 'night'
  startSMR: number
  closeSMR: number
  hoursWorked: number
  comment?: string
}

export interface DozerRolloverClientProps {
  initialRecords: DozerRolloverRecord[]
  rolloverMultiplier?: number // Default is 250 BCM per worked hour
}

export function DozerRolloverClient({
  initialRecords,
  rolloverMultiplier = 250,
}: DozerRolloverClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [shiftFilter, setShiftFilter] = useState<'all' | 'day' | 'night'>('all')

  const filteredRecords = initialRecords.filter((rec) => {
    const matchesSearch =
      rec.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.comment && rec.comment.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesShift = shiftFilter === 'all' || rec.shiftType === shiftFilter

    return matchesSearch && matchesShift
  })

  // Calculate summary metrics using formula: Worked Hours * rolloverMultiplier (250 BCM/hr)
  const totalWorkedHours = filteredRecords.reduce((sum, r) => sum + r.hoursWorked, 0)
  const totalRolloverBcm = totalWorkedHours * rolloverMultiplier

  return (
    <div className="space-y-6">
      {/* KPI Stats Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-400/10 rounded-lg text-yellow-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Dozer Units
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {filteredRecords.length}
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-400/10 rounded-lg text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Total Worked SMR Hours
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {totalWorkedHours.toFixed(1)} h
              </h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-400/10 rounded-lg text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Calculated Rollover (BCM)
              </p>
              <h4 className="text-2xl font-bold text-emerald-400 mt-0.5">
                {totalRolloverBcm.toLocaleString('en-US', { maximumFractionDigits: 0 })} BCM
              </h4>
              <span className="text-[10px] text-arch-text-muted">
                Formula: Worked Hours × {rolloverMultiplier} BCM/hr
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-arch-text-muted" />
          <input
            type="text"
            placeholder="Search dozer, site, operator or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-arch-surface/50 border border-arch-border text-arch-text-primary focus:outline-none focus:ring-1 focus:ring-arch-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-arch-text-muted" />
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value as 'all' | 'day' | 'night')}
            className="h-8 rounded-lg bg-arch-surface/50 border border-arch-border text-arch-text-primary text-xs px-2 focus:outline-none"
          >
            <option value="all">All Shifts</option>
            <option value="day">Day Shift</option>
            <option value="night">Night Shift</option>
          </select>
        </div>
      </div>

      {/* Main Dozer Rollover Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold">Dozer Machine</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Site</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Operator</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Shift</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right">Start SMR</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right">Close SMR</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right">Worked Hours</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Comments / Notes</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-right text-emerald-400">
                  Rollover (BCM)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const rolloverBcm = rec.hoursWorked * rolloverMultiplier
                  return (
                    <TableRow
                      key={rec.id}
                      className="border-b border-arch-border/50 hover:bg-white/5"
                    >
                      <TableCell className="px-4 py-3 font-semibold text-arch-text-primary">
                        {rec.machineName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary">
                        {rec.siteName}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-arch-text-secondary">
                        {rec.operatorName || 'Unassigned'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          className={
                            rec.shiftType === 'day'
                              ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                              : 'bg-indigo-400/20 text-indigo-400 border-indigo-400/30'
                          }
                        >
                          {rec.shiftDate} ({rec.shiftType})
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-arch-text-muted">
                        {rec.startSMR.toFixed(1)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono text-arch-text-muted">
                        {rec.closeSMR.toFixed(1)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono font-semibold text-arch-text-primary">
                        {rec.hoursWorked.toFixed(1)} h
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-arch-text-muted max-w-xs truncate">
                        {rec.comment || 'Rollover operational duty'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {rolloverBcm.toLocaleString('en-US', { maximumFractionDigits: 0 })} BCM
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="px-4 py-8 text-center text-arch-text-muted">
                    No dozer rollover records found for the selected criteria.
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
