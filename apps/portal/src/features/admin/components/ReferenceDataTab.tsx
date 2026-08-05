'use client'

/**
 * ReferenceDataTab — generic Admin CRUD editor for reference tables that are
 * owned and managed only from the Admin department (operators, sites,
 * delay_categories). Renders an editable table with create / update / delete,
 * writes through the browser Supabase client, and records an admin audit event
 * for each mutation.
 *
 * AGENT-TRACE: this is the single Admin surface for these reference tables —
 * the same tables are consumed (read-only) by department UIs like Control Room
 * (operators/sites for the shift sheet, delay_categories for breakdown logs).
 */

import { useState } from 'react'
import { useAdminData, useSupabaseClient } from '@/hooks/useAdminData'
import { GlassCard } from '@repo/ui/GlassCard'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { logError } from '@/lib/errors/error-logger'
import { recordAdminAuditEvent } from '@/lib/audit'

export interface ColumnDef {
  key: string
  label: string
  editable?: boolean
  type?: 'text' | 'number' | 'color' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

interface ReferenceDataTabProps {
  tableName: string
  title: string
  description: string
  columns: ColumnDef[]
  displayColumns?: string[]
  insertDefaults?: Record<string, unknown>
  softDelete?: boolean
}

export function ReferenceDataTab({
  tableName,
  title,
  description,
  columns,
  displayColumns,
  insertDefaults = {},
  softDelete = true,
}: ReferenceDataTabProps) {
  const supabase = useSupabaseClient()
  type Row = Record<string, unknown> & { id: string }
  const { data, loading, reload } = useAdminData<Row>(async (sb) =>
    sb.from(tableName).select('*').order('created_at', { ascending: false })
  )

  const editableCols = columns.filter((c) => c.editable)
  const shown = displayColumns ?? editableCols.map((c) => c.key)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [newRow, setNewRow] = useState<Record<string, string> | null>(null)

  function startEdit(row: Row) {
    const d: Record<string, string> = {}
    editableCols.forEach((c) => {
      const v = row[c.key]
      d[c.key] = v == null ? '' : String(v)
    })
    setDraft(d)
    setEditingId(row.id)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({})
  }

  async function saveEdit(row: Row) {
    const payload: Record<string, unknown> = {}
    editableCols.forEach((c) => {
      const raw = draft[c.key] ?? ''
      payload[c.key] = c.type === 'number' ? (raw === '' ? null : Number(raw)) : raw
    })
    const { error } = await supabase.from(tableName).update(payload).eq('id', row.id)
    if (error) {
      logError(new Error(error.message), { context: `${tableName}_update` })
      return
    }
    await recordAdminAuditEvent({
      action: `${tableName}.updated`,
      entityType: tableName,
      entityId: row.id,
      details: payload,
    }).catch((e) =>
      logError(e instanceof Error ? e : new Error(String(e)), { context: `${tableName}_audit` })
    )
    cancelEdit()
    reload()
  }

  async function startCreate() {
    const d: Record<string, string> = {}
    editableCols.forEach((c) => (d[c.key] = ''))
    setNewRow(d)
  }

  async function saveCreate() {
    if (!newRow) return
    const payload: Record<string, unknown> = { ...insertDefaults }
    editableCols.forEach((c) => {
      const raw = newRow[c.key] ?? ''
      payload[c.key] = c.type === 'number' ? (raw === '' ? null : Number(raw)) : raw
    })
    const { data: created, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select('id')
      .single()
    if (error) {
      logError(new Error(error.message), { context: `${tableName}_create` })
      return
    }
    await recordAdminAuditEvent({
      action: `${tableName}.created`,
      entityType: tableName,
      entityId: created?.id,
      details: payload,
    }).catch((e) =>
      logError(e instanceof Error ? e : new Error(String(e)), { context: `${tableName}_audit` })
    )
    setNewRow(null)
    reload()
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Delete this ${title.toLowerCase().replace(/s$/, '')}?`)) return
    const { error } = softDelete
      ? await supabase
          .from(tableName)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', row.id)
      : await supabase.from(tableName).delete().eq('id', row.id)
    if (error) {
      logError(new Error(error.message), { context: `${tableName}_delete` })
      return
    }
    await recordAdminAuditEvent({
      action: `${tableName}.deleted`,
      entityType: tableName,
      entityId: row.id,
      details: { id: row.id },
    }).catch((e) =>
      logError(e instanceof Error ? e : new Error(String(e)), { context: `${tableName}_audit` })
    )
    reload()
  }

  function renderCell(col: ColumnDef, value: unknown) {
    if (editingId && col.editable) {
      if (col.type === 'select') {
        return (
          <select
            value={draft[col.key] ?? ''}
            onChange={(e) => setDraft({ ...draft, [col.key]: e.target.value })}
            className="h-8 w-full rounded-md border border-arch-border bg-arch-surface/50 px-2 text-arch-text-primary text-xs"
          >
            <option value="">—</option>
            {col.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )
      }
      return (
        <Input
          type={col.type === 'color' ? 'color' : col.type === 'number' ? 'number' : 'text'}
          value={draft[col.key] ?? ''}
          placeholder={col.placeholder}
          onChange={(e) => setDraft({ ...draft, [col.key]: e.target.value })}
          className="h-8 w-full bg-arch-surface/50 border-arch-border text-arch-text-primary text-xs"
        />
      )
    }
    if (col.type === 'color')
      return (
        <span
          className="inline-block h-4 w-4 rounded border border-arch-border"
          style={{ background: String(value ?? '#000') }}
        />
      )
    return (
      <span className="text-arch-text-primary">
        {value == null || value === '' ? '—' : String(value)}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">{title}</h2>
          <p className="text-arch-text-muted text-sm">{description}</p>
        </div>
        <Button size="sm" onClick={startCreate} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-left border-collapse min-w-full">
            <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
              <TableRow>
                {shown.map((key) => {
                  const col = columns.find((c) => c.key === key)
                  return (
                    <TableHead
                      key={key}
                      className={`px-4 py-3 font-semibold capitalize ${col?.className ?? ''}`}
                    >
                      {col?.label ?? key.replace(/_/g, ' ')}
                    </TableHead>
                  )
                })}
                <TableHead className="px-4 py-3 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={shown.length + 1}
                    className="px-4 py-8 text-center text-arch-text-muted"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {/* New row */}
              {newRow && (
                <TableRow className="border-b border-arch-border/50 bg-arch-accent-charcoal/10">
                  {editableCols.map((col) => (
                    <TableCell key={col.key} className="px-4 py-2">
                      {col.type === 'select' ? (
                        <select
                          value={newRow[col.key] ?? ''}
                          onChange={(e) => setNewRow({ ...newRow, [col.key]: e.target.value })}
                          className="h-8 w-full rounded-md border border-arch-border bg-arch-surface/50 px-2 text-arch-text-primary text-xs"
                        >
                          <option value="">—</option>
                          {col.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={newRow[col.key] ?? ''}
                          placeholder={col.placeholder}
                          onChange={(e) => setNewRow({ ...newRow, [col.key]: e.target.value })}
                          className="h-8 w-full bg-arch-surface/50 border-arch-border text-arch-text-primary text-xs"
                        />
                      )}
                    </TableCell>
                  ))}
                  {shown
                    .filter((k) => !editableCols.some((c) => c.key === k))
                    .map((k) => (
                      <TableCell key={k} className="px-4 py-2">
                        {''}
                      </TableCell>
                    ))}
                  <TableCell className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveCreate}
                        className="h-7 px-2 text-accent-green"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNewRow(null)}
                        className="h-7 px-2 text-arch-text-muted"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && data.length === 0 && !newRow && (
                <TableRow>
                  <TableCell
                    colSpan={shown.length + 1}
                    className="px-4 py-8 text-center text-arch-text-muted"
                  >
                    No records yet.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10"
                  >
                    {shown.map((key) => {
                      const col = columns.find((c) => c.key === key)
                      return (
                        <TableCell key={key} className="px-4 py-3">
                          {renderCell(col ?? { key, label: key }, row[key])}
                        </TableCell>
                      )
                    })}
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {editingId === row.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEdit(row)}
                              className="h-7 px-2 text-accent-green"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="h-7 px-2 text-arch-text-muted"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(row)}
                              className="h-7 px-2 text-arch-text-secondary hover:text-arch-text-primary"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(row)}
                              className="h-7 px-2 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  )
}
