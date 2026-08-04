'use client'

import { useMemo, useState } from 'react'
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
import { Shovel, Plus, Trash2, MapPin } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BuilderSite {
  id: string
  name: string
}

export interface BuilderMachine {
  id: string
  name: string
  machine_type: string
  serial_number: string | null
  bin_factor: number | null
  site_id: string | null
}

export interface BuilderActivity {
  id: string
  activity_date: string
  shift_type: string
  loads: number
  passes: number
  material_type: string | null
  estimated_tonnes: number | null
  machine_id: string
  site_id: string | null
  operator: string | null
}

export interface ExcavatorActivityBuilderProps {
  sites: BuilderSite[]
  machines: BuilderMachine[]
  activities: BuilderActivity[]
  /** machine_id -> total hours worked pulled from machine_hours (previous data) */
  hoursByMachine: Record<string, number>
}

interface Section {
  id: string
  siteId: string
  excavatorId: string
}

const EXCAVATOR_TYPES = /excavator|shovel|backhoe|digger/i

function isExcavatorType(machineType: string): boolean {
  return EXCAVATOR_TYPES.test(machineType)
}

/** Return the field value from the activity record with the newest activity_date. */
function newestValue(
  rows: BuilderActivity[],
  field: (a: BuilderActivity) => string | null
): string | null {
  if (rows.length === 0) return null
  const newest = rows.reduce<BuilderActivity | null>(
    (best, row) => (best ? (row.activity_date > best.activity_date ? row : best) : row),
    null
  )
  return newest ? field(newest) : null
}

function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: digits,
  })
}

/* ------------------------------------------------------------------ */
/*  Section (single site -> excavator -> table)                        */
/* ------------------------------------------------------------------ */

function SectionTable({
  section,
  sites,
  machines,
  activities,
  hoursByMachine,
  onUpdate,
  onRemove,
}: {
  section: Section
  sites: BuilderSite[]
  machines: BuilderMachine[]
  activities: BuilderActivity[]
  hoursByMachine: Record<string, number>
  onUpdate: (id: string, patch: Partial<Section>) => void
  onRemove: (id: string) => void
}) {
  // Excavator machines available for the selected site.
  const siteMachines = useMemo(
    () => machines.filter((m) => m.site_id === section.siteId && isExcavatorType(m.machine_type)),
    [machines, section.siteId]
  )

  // The selected excavator machine.
  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === section.excavatorId) ?? null,
    [machines, section.excavatorId]
  )

  // Prior activity records for the selected excavator (and its site).
  const machineActivities = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.machine_id === section.excavatorId && (!section.siteId || a.site_id === section.siteId)
      ),
    [activities, section.excavatorId, section.siteId]
  )

  const sectionOpen = Boolean(section.siteId)
  const ready = Boolean(section.excavatorId && machineActivities.length > 0)

  // Derived aggregates — pulled from previous data.
  const totalLoads = machineActivities.reduce((sum, a) => sum + (a.loads || 0), 0)
  const totalPasses = machineActivities.reduce((sum, a) => sum + (a.passes || 0), 0)
  const operator = newestValue(machineActivities, (a) => a.operator)
  const material = newestValue(machineActivities, (a) => a.material_type)
  const binFactor = selectedMachine?.bin_factor ?? 0
  const totalMoved = totalLoads * binFactor
  const hoursWorked = hoursByMachine[section.excavatorId] ?? 0

  return (
    <GlassCard className="p-0 overflow-hidden">
      {/* Section header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-arch-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-400/10 rounded-lg text-yellow-400">
            <Shovel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-arch-text-primary">
              Excavator Activity Section
            </h3>
            <p className="text-xs text-arch-text-muted">
              Select a site, then an excavator filtered by that site.
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(section.id)}
          aria-label="Remove section"
          className="p-2 rounded-lg text-arch-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Step 1: Site selector */}
      <div className="px-5 py-4 space-y-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-arch-text-muted">
            Step 1 — Site
          </label>
          <select
            aria-label="Select site"
            value={section.siteId}
            onChange={(e) => onUpdate(section.id, { siteId: e.target.value, excavatorId: '' })}
            className="mt-1 w-full bg-arch-surface-secondary border border-arch-border rounded-lg px-3 py-2 text-sm text-arch-text-primary outline-none focus:border-arch-accent-blue transition-colors"
          >
            <option value="">— Select Site —</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Excavator selector (filtered by site) — appears after a site is chosen */}
        {sectionOpen && (
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-arch-text-muted">
              Step 2 — Excavator
            </label>
            <select
              aria-label="Select excavator"
              value={section.excavatorId}
              onChange={(e) => onUpdate(section.id, { excavatorId: e.target.value })}
              className="mt-1 w-full bg-arch-surface-secondary border border-arch-border rounded-lg px-3 py-2 text-sm text-arch-text-primary outline-none focus:border-arch-accent-blue transition-colors"
            >
              <option value="">— Select Excavator —</option>
              {siteMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.serial_number ?? m.machine_type})
                </option>
              ))}
            </select>
            {siteMachines.length === 0 && (
              <p className="mt-1.5 text-xs text-arch-text-muted">
                No excavators assigned to this site yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Step 3: Data table — appears once an excavator with prior data is selected */}
      {section.excavatorId && (
        <div className="px-5 pb-5">
          {ready ? (
            <div className="overflow-x-auto">
              <Table className="w-full text-left border-collapse min-w-[820px]">
                <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
                  <TableRow>
                    <TableHead className="px-4 py-3 font-semibold">Machine ID</TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Operator</TableHead>
                    <TableHead className="px-4 py-3 text-center font-semibold">
                      Hours Worked
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center font-semibold">
                      Total Loads
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold">Material</TableHead>
                    <TableHead className="px-4 py-3 text-center font-semibold">
                      Bin Factor
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-semibold">
                      Total Material Moved
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-sm">
                  <TableRow className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-arch-text-muted" />
                        <div>
                          <span className="font-semibold text-arch-text-primary block">
                            {selectedMachine?.name ?? '—'}
                          </span>
                          <span className="text-xs text-arch-text-muted font-mono">
                            {selectedMachine?.serial_number ?? selectedMachine?.id ?? ''}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-arch-text-secondary font-medium">
                      {operator ?? 'No Operator'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-mono text-arch-text-primary">
                      {hoursWorked > 0 ? `${formatNumber(hoursWorked)}h` : '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-bold text-arch-text-primary">
                      {totalLoads.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {material ? (
                        <Badge className="bg-white/5 text-arch-text-secondary border-white/10 text-[11px] py-0 px-2 hover:bg-white/10 capitalize">
                          {material}
                        </Badge>
                      ) : (
                        <span className="text-arch-text-muted text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center font-mono text-arch-text-secondary">
                      {binFactor > 0 ? formatNumber(binFactor, 1) : '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-bold font-mono text-orange-400">
                      {totalMoved > 0 ? `${formatNumber(totalMoved)} t` : '—'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="mt-2 text-right text-[11px] text-arch-text-muted">
                {machineActivities.length} prior record(s) · {totalPasses.toLocaleString()} total
                passes · Avg {totalLoads > 0 ? (totalPasses / totalLoads).toFixed(1) : '0'}{' '}
                pass/load
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-arch-text-muted">
              <p className="text-sm">No prior excavator activity found for this machine.</p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Builder (manages the list of sections)                             */
/* ------------------------------------------------------------------ */

export function ExcavatorActivityBuilder({
  sites,
  machines,
  activities,
  hoursByMachine,
}: ExcavatorActivityBuilderProps) {
  const [sections, setSections] = useState<Section[]>([])

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}-${prev.length}`,
        siteId: '',
        excavatorId: '',
      },
    ])

  const removeSection = (id: string) => setSections((prev) => prev.filter((s) => s.id !== id))

  const updateSection = (id: string, patch: Partial<Section>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <SectionTable
          key={section.id}
          section={section}
          sites={sites}
          machines={machines}
          activities={activities}
          hoursByMachine={hoursByMachine}
          onUpdate={updateSection}
          onRemove={removeSection}
        />
      ))}

      <button
        onClick={addSection}
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-arch-border text-arch-text-muted hover:text-arch-accent-blue hover:border-arch-accent-blue/50 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-semibold">Add Excavator</span>
      </button>
    </div>
  )
}
