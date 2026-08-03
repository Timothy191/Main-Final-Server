'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@repo/ui/GlassCard'
import { createBrowserSupabaseClient } from '@repo/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table'
import { cn } from '@repo/ui/lib/utils'
import { Check, Loader2, Sun, Moon, AlertCircle } from 'lucide-react'
import { getOperationalToday } from '@repo/utils'

type Shift = 'day' | 'night'

interface DrillOpRow {
  id?: string
  machine_id: string
  shift_type: Shift
  operation_date?: string
  open_hours: number | null
  close_hours: number | null
  total_hours: number | null
  operator_name: string | null
  block_drilled: string | null
  site: string | null
  external_delays_minutes: number | null
  standard_delays_hours: number | null
  production_delays_minutes: number | null
  engineering_delays_minutes: number | null
  comments: string | null
  status?: string
}

interface Machine {
  id: string
  name: string
}

interface Operator {
  id: string
  full_name: string
}

interface Props {
  departmentId: string
  drills: Machine[]
  operators: Operator[]
  initialOps: DrillOpRow[]
}

const today = getOperationalToday()

function numOrNull(v: string): number | null {
  if (v === '' || v === '-') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return ''
  return Number(n).toFixed(digits)
}

export function DrillingOperationsTable({ departmentId, drills, operators, initialOps }: Props) {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  // Local working copy: keyed by `${machine_id}:${shift_type}`
  const [rows, setRows] = useState<Record<string, DrillOpRow>>(() => {
    const map: Record<string, DrillOpRow> = {}
    for (const o of initialOps) {
      const k = `${o.machine_id}:${o.shift_type}`
      map[k] = {
        ...map[k],
        ...o,
      }
    }
    return map
  })

  // Per-machine active shift toggle (defaults to "day" on first load)
  const [activeShift, setActiveShift] = useState<Record<string, Shift>>(() => {
    const m: Record<string, Shift> = {}
    for (const d of drills) m[d.id] = 'day'
    return m
  })

  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Per-row live editing buffer — only committed on blur
  const [draft, setDraft] = useState<Record<string, string>>({})

  const draftKey = useCallback(
    (machineId: string, shift: Shift, field: string) => `${machineId}:${shift}:${field}`,
    []
  )

  function getDraftValue(machineId: string, shift: Shift, field: keyof DrillOpRow): string {
    const dk = draftKey(machineId, shift, field)
    if (Object.prototype.hasOwnProperty.call(draft, dk)) {
      return draft[dk] ?? ''
    }
    const row = rows[`${machineId}:${shift}`]
    if (!row) return ''
    const v = row[field]
    if (v === null || v === undefined) return ''
    return String(v)
  }

  function setDraftValue(machineId: string, shift: Shift, field: keyof DrillOpRow, value: string) {
    const dk = draftKey(machineId, shift, field)
    setDraft((d) => ({ ...d, [dk]: value }))
  }

  const upsertRow = useCallback(
    async (
      machineId: string,
      shift: Shift,
      patch: Partial<DrillOpRow>
    ): Promise<DrillOpRow | null> => {
      if (!departmentId) return null
      const key = `${machineId}:${shift}`
      const existing = rows[key]

      // Compute standard_delays_hours default on first save only
      const standardDefault = existing?.standard_delays_hours ?? 2.0

      const payload: Record<string, unknown> = {
        department_id: departmentId,
        machine_id: machineId,
        shift_type: shift,
        operation_date: today,
        standard_delays_hours: standardDefault,
        ...(existing ?? {}),
        ...patch,
      }

      // Ensure numeric fields are sent as numbers, not strings
      const numericFields: (keyof DrillOpRow)[] = [
        'open_hours',
        'close_hours',
        'external_delays_minutes',
        'standard_delays_hours',
        'production_delays_minutes',
        'engineering_delays_minutes',
      ]
      for (const f of numericFields) {
        if (f in payload) {
          const v = payload[f as string]
          if (v === null || v === '' || v === undefined) {
            payload[f as string] = null
          } else {
            const n = Number(v)
            payload[f as string] = Number.isFinite(n) ? n : null
          }
        }
      }

      const { data, error } = await supabase
        .from('drill_operations')
        .upsert(payload, {
          onConflict: 'machine_id,operation_date,shift_type',
        })
        .select()
        .single()

      if (error) {
        setErrors((e) => ({
          ...e,
          [key]: error.message || 'Save failed',
        }))
        return null
      }
      if (data) {
        setRows((r) => ({ ...r, [key]: data as DrillOpRow }))
        setErrors((e) => {
          const { [key]: _, ...rest } = e
          return rest
        })
      }
      return (data as DrillOpRow) ?? null
    },
    [departmentId, rows, supabase]
  )

  async function commitField(machineId: string, shift: Shift, field: keyof DrillOpRow) {
    const dk = draftKey(machineId, shift, field)
    const value = draft[dk]
    if (value === undefined) return // nothing changed

    // Clear the draft entry — the row will be re-rendered from `rows`
    setDraft((d) => {
      const { [dk]: _drop, ...rest } = d
      return rest
    })

    setSaving(`${machineId}:${shift}`)
    const parsed: Partial<DrillOpRow> = {} as Partial<DrillOpRow>
    if (
      field === 'open_hours' ||
      field === 'close_hours' ||
      field === 'external_delays_minutes' ||
      field === 'standard_delays_hours' ||
      field === 'production_delays_minutes' ||
      field === 'engineering_delays_minutes'
    ) {
      ;(parsed as Record<string, unknown>)[field] = numOrNull(value)
    } else {
      // text fields
      ;(parsed as Record<string, unknown>)[field] = value === '' ? null : value
    }

    await upsertRow(machineId, shift, parsed)
    setSaving(null)
    const key = `${machineId}:${shift}`
    setSaved(key)
    setTimeout(() => setSaved((cur) => (cur === key ? null : cur)), 1500)
    router.refresh()
  }

  function setShift(machineId: string, shift: Shift) {
    setActiveShift((m) => ({ ...m, [machineId]: shift }))
  }

  const cellInputClass = cn(
    'w-full bg-arch-surface-secondary border border-arch-border-default',
    'rounded px-2 py-1 text-sm text-arch-text-primary',
    'focus:outline-none focus:border-arch-accent-charcoal',
    'min-w-0'
  )

  if (drills.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <p className="text-arch-text-muted">
          No active drill rigs registered. Add rigs in the Machines section first.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-arch-text-primary">{today} — Shift Log</h3>
          <p className="text-sm text-arch-text-muted mt-1">
            One row per drill rig. Toggle Day/Night inside each row to switch the active shift.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-arch-text-muted">
          {saving && (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
          {saved && !saving && (
            <span className="inline-flex items-center gap-1.5 text-accent-green">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-arch-border-subtle hover:bg-transparent">
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider sticky left-0 bg-arch-surface-primary z-10">
                Machine
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider">
                Shift
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider">
                Block
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider">
                Site
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Open
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Close
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Total
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider">
                Operator
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Ext. (min)
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Std. (h)
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Prod (min)
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider text-right">
                Eng (min)
              </TableHead>
              <TableHead className="text-arch-text-muted font-medium text-xs uppercase tracking-wider">
                Comments
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drills.map((drill) => {
              const shift = activeShift[drill.id] ?? 'day'
              const key = `${drill.id}:${shift}`
              const error = errors[key]
              const isSaving = saving === key
              const isSaved = saved === key
              const openVal = getDraftValue(drill.id, shift, 'open_hours')
              const closeVal = getDraftValue(drill.id, shift, 'close_hours')
              const oN = numOrNull(openVal)
              const cN = numOrNull(closeVal)
              const liveTotal = oN !== null && cN !== null && cN >= oN ? cN - oN : null

              return (
                <TableRow
                  key={drill.id}
                  className="border-b border-arch-border-subtle hover:bg-arch-surface-tertiary/30"
                >
                  <TableCell className="font-medium text-arch-text-primary sticky left-0 bg-arch-surface-primary z-10">
                    <div className="flex items-center gap-2">
                      <span>{drill.name}</span>
                      {error && (
                        <span title={error} className="inline-flex items-center text-accent-red">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {isSaving && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-arch-text-muted" />
                      )}
                      {isSaved && !isSaving && <Check className="w-3.5 h-3.5 text-accent-green" />}
                    </div>
                  </TableCell>

                  {/* Shift toggle */}
                  <TableCell>
                    <div className="inline-flex rounded border border-arch-border-default overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShift(drill.id, 'day')}
                        className={cn(
                          'px-2 py-1 text-xs font-medium flex items-center gap-1',
                          shift === 'day'
                            ? 'bg-arch-accent-charcoal text-white'
                            : 'bg-arch-surface-secondary text-arch-text-muted hover:bg-arch-surface-tertiary'
                        )}
                        aria-label="Day shift"
                      >
                        <Sun className="w-3 h-3" />
                        Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setShift(drill.id, 'night')}
                        className={cn(
                          'px-2 py-1 text-xs font-medium flex items-center gap-1 border-l border-arch-border-default',
                          shift === 'night'
                            ? 'bg-arch-accent-charcoal text-white'
                            : 'bg-arch-surface-secondary text-arch-text-muted hover:bg-arch-surface-tertiary'
                        )}
                        aria-label="Night shift"
                      >
                        <Moon className="w-3 h-3" />
                        Night
                      </button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <input
                      type="text"
                      value={getDraftValue(drill.id, shift, 'block_drilled')}
                      onChange={(e) =>
                        setDraftValue(drill.id, shift, 'block_drilled', e.target.value)
                      }
                      onBlur={() => commitField(drill.id, shift, 'block_drilled')}
                      placeholder="—"
                      className={cellInputClass}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={getDraftValue(drill.id, shift, 'site')}
                      onChange={(e) => setDraftValue(drill.id, shift, 'site', e.target.value)}
                      onBlur={() => commitField(drill.id, shift, 'site')}
                      placeholder="—"
                      className={cellInputClass}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="0.01"
                      value={openVal}
                      onChange={(e) => setDraftValue(drill.id, shift, 'open_hours', e.target.value)}
                      onBlur={() => commitField(drill.id, shift, 'open_hours')}
                      placeholder="—"
                      className={cn(cellInputClass, 'text-right')}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="0.01"
                      value={closeVal}
                      onChange={(e) =>
                        setDraftValue(drill.id, shift, 'close_hours', e.target.value)
                      }
                      onBlur={() => commitField(drill.id, shift, 'close_hours')}
                      placeholder="—"
                      className={cn(cellInputClass, 'text-right')}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium text-arch-accent-charcoal tabular-nums">
                    {fmt(liveTotal, 2) || '—'}
                  </TableCell>
                  <TableCell>
                    <select
                      value={getDraftValue(drill.id, shift, 'operator_name')}
                      onChange={(e) => {
                        setDraftValue(drill.id, shift, 'operator_name', e.target.value)
                        // commit immediately on select change
                        // (avoids the focus-trap of commitField-on-blur on selects)
                        const dk = draftKey(drill.id, shift, 'operator_name')
                        setDraft((d) => {
                          const { [dk]: _drop, ...rest } = d
                          return rest
                        })
                        upsertRow(drill.id, shift, {
                          operator_name: e.target.value || null,
                        })
                        router.refresh()
                      }}
                      className={cellInputClass}
                    >
                      <option value="">—</option>
                      {operators.map((o) => (
                        <option key={o.id} value={o.full_name}>
                          {o.full_name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={getDraftValue(drill.id, shift, 'external_delays_minutes')}
                      onChange={(e) =>
                        setDraftValue(drill.id, shift, 'external_delays_minutes', e.target.value)
                      }
                      onBlur={() => commitField(drill.id, shift, 'external_delays_minutes')}
                      placeholder="0"
                      className={cn(cellInputClass, 'text-right')}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={getDraftValue(drill.id, shift, 'standard_delays_hours')}
                      onChange={(e) =>
                        setDraftValue(drill.id, shift, 'standard_delays_hours', e.target.value)
                      }
                      onBlur={() => commitField(drill.id, shift, 'standard_delays_hours')}
                      placeholder="2.00"
                      className={cn(cellInputClass, 'text-right')}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={getDraftValue(drill.id, shift, 'production_delays_minutes')}
                      onChange={(e) =>
                        setDraftValue(drill.id, shift, 'production_delays_minutes', e.target.value)
                      }
                      onBlur={() => commitField(drill.id, shift, 'production_delays_minutes')}
                      placeholder="0"
                      className={cn(cellInputClass, 'text-right')}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={getDraftValue(drill.id, shift, 'engineering_delays_minutes')}
                      onChange={(e) =>
                        setDraftValue(drill.id, shift, 'engineering_delays_minutes', e.target.value)
                      }
                      onBlur={() => commitField(drill.id, shift, 'engineering_delays_minutes')}
                      placeholder="0"
                      className={cn(cellInputClass, 'text-right')}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={getDraftValue(drill.id, shift, 'comments')}
                      onChange={(e) => setDraftValue(drill.id, shift, 'comments', e.target.value)}
                      onBlur={() => commitField(drill.id, shift, 'comments')}
                      placeholder="—"
                      className={cn(cellInputClass, 'min-w-[160px]')}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
