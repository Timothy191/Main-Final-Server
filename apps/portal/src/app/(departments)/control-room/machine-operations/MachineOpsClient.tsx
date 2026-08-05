'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { TableRow, TableCell } from '@repo/ui/components/ui/table'
import { Input } from '@repo/ui/components/ui/input'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Save, CheckCircle2, Cpu } from 'lucide-react'

import {
  upsertMachineOperation,
  closeMachineOperation,
  type MachineOperationSmrRow,
} from '../actions'

interface ShiftSelectorProps {
  shiftDate: string
  shiftType: 'day' | 'night'
}

function ShiftSelector({ shiftDate, shiftType }: ShiftSelectorProps) {
  const router = useRouter()

  return (
    <form
      action={(formData) => {
        const date = formData.get('shiftDate') as string
        const type = formData.get('shiftType') as string
        const params = new URLSearchParams()
        if (date) params.set('shiftDate', date)
        if (type) params.set('shiftType', type)
        router.push(`?${params.toString()}`)
      }}
      className="flex items-center gap-2"
    >
      <Input
        type="date"
        name="shiftDate"
        defaultValue={shiftDate}
        className="w-auto bg-arch-surface/50 border-arch-border text-arch-text-primary"
      />
      <select
        name="shiftType"
        defaultValue={shiftType}
        className="h-9 rounded-md border border-arch-border bg-arch-surface/50 px-3 text-arch-text-primary focus:outline-none focus:ring-1 focus:ring-arch-accent"
      >
        <option value="day">Day</option>
        <option value="night">Night</option>
      </select>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="border-arch-border text-arch-text-secondary hover:bg-arch-accent-charcoal/20"
      >
        Apply
      </Button>
    </form>
  )
}

interface RowProps {
  row: MachineOperationSmrRow
  sites: { id: string; name: string }[]
  operators: { id: string; fullName: string }[]
}

function Row({ row, sites, operators }: RowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [closeSMR, setCloseSMR] = useState<string>(row.closeSMR?.toString() ?? '')
  const [operatorId, setOperatorId] = useState<string>(row.operatorId ?? '')
  const [siteId, setSiteId] = useState<string>(row.siteId ?? '')
  const [natural, setNatural] = useState<string>(row.naturalDelayMinutes.toString())
  const [nonProd, setNonProd] = useState<string>(row.nonProductionDelayMinutes.toString())
  const [production, setProduction] = useState<string>(row.productionDelayMinutes.toString())
  const [engineering, setEngineering] = useState<string>(row.engineeringDelayMinutes.toString())

  const isClosed = row.closeSMR != null

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertMachineOperation({
          machineId: row.machineId,
          shiftDate: row.shiftDate,
          shiftType: row.shiftType,
          siteId: siteId || null,
          operatorId: operatorId || null,
          startSMR: row.startSMR,
          closeSMR: closeSMR ? Number(closeSMR) : null,
          naturalDelayMinutes: Number(natural || 0),
          nonProductionDelayMinutes: Number(nonProd || 0),
          productionDelayMinutes: Number(production || 0),
          engineeringDelayMinutes: Number(engineering || 0),
        })
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        Sentry.captureException(err, { tags: { action: 'save_machine_operation' } })
        Sentry.logger.error('Failed to save machine operation', {
          error_message: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  function handleClose() {
    if (!closeSMR) return
    startTransition(async () => {
      try {
        if (row.id) {
          await closeMachineOperation(row.id, Number(closeSMR))
        } else {
          await upsertMachineOperation({
            machineId: row.machineId,
            shiftDate: row.shiftDate,
            shiftType: row.shiftType,
            siteId: siteId || null,
            operatorId: operatorId || null,
            startSMR: row.startSMR,
            closeSMR: Number(closeSMR),
            naturalDelayMinutes: Number(natural || 0),
            nonProductionDelayMinutes: Number(nonProd || 0),
            productionDelayMinutes: Number(production || 0),
            engineeringDelayMinutes: Number(engineering || 0),
          })
        }
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        Sentry.captureException(err, { tags: { action: 'close_machine_operation' } })
        Sentry.logger.error('Failed to close machine operation', {
          error_message: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  const totalDisplay = row.smrTotal != null ? row.smrTotal.toFixed(2) : '-'
  const utilizationDisplay = row.utilizationPct != null ? `${row.utilizationPct.toFixed(1)}%` : '-'
  const availabilityDisplay =
    row.availabilityPct != null ? `${row.availabilityPct.toFixed(1)}%` : '-'

  return (
    <TableRow className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors">
      <TableCell className="px-3 py-2 align-middle sticky left-0 z-10 bg-[var(--bg-primary)] border-r border-arch-border/50">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-arch-text-secondary shrink-0" />
          <div>
            <span className="font-semibold text-arch-text-primary block">{row.machineName}</span>
            <span className="text-xs text-arch-text-muted">{row.machineType}</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="px-3 py-2 align-middle">
        <select
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          disabled={isPending}
          className="h-8 w-full rounded-md border border-arch-border bg-arch-surface/50 px-2 text-arch-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-arch-accent disabled:opacity-50"
        >
          <option value="">—</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </TableCell>

      <TableCell className="px-3 py-2 align-middle text-right font-mono text-arch-text-primary">
        {row.startSMR != null ? row.startSMR.toFixed(2) : '-'}
      </TableCell>

      <TableCell className="px-3 py-2 align-middle text-right">
        <Input
          type="number"
          min={row.startSMR ?? 0}
          step="0.01"
          value={closeSMR}
          onChange={(e) => setCloseSMR(e.target.value)}
          disabled={isPending || isClosed}
          className="h-8 w-24 ml-auto bg-arch-surface/50 border-arch-border text-arch-text-primary text-right text-xs disabled:opacity-50"
          placeholder="Close"
        />
      </TableCell>

      <TableCell className="px-3 py-2 align-middle text-right font-mono font-semibold text-arch-text-primary">
        {totalDisplay}
      </TableCell>

      <TableCell className="px-3 py-2 align-middle">
        <select
          value={operatorId}
          onChange={(e) => setOperatorId(e.target.value)}
          disabled={isPending}
          className="h-8 w-full rounded-md border border-arch-border bg-arch-surface/50 px-2 text-arch-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-arch-accent disabled:opacity-50"
        >
          <option value="">—</option>
          {operators.map((o) => (
            <option key={o.id} value={o.id}>
              {o.fullName}
            </option>
          ))}
        </select>
      </TableCell>

      {[
        { value: natural, setter: setNatural },
        { value: nonProd, setter: setNonProd },
        { value: production, setter: setProduction },
        { value: engineering, setter: setEngineering },
      ].map((field, idx) => (
        <TableCell key={idx} className="px-3 py-2 align-middle text-right">
          <Input
            type="number"
            min={0}
            step="1"
            value={field.value}
            onChange={(e) => field.setter(e.target.value)}
            disabled={isPending || isClosed}
            className="h-8 w-20 ml-auto bg-arch-surface/50 border-arch-border text-arch-text-primary text-right text-xs disabled:opacity-50"
          />
        </TableCell>
      ))}

      <TableCell className="px-3 py-2 align-middle text-right font-mono text-arch-text-secondary">
        {utilizationDisplay}
      </TableCell>

      <TableCell className="px-3 py-2 align-middle text-right font-mono text-arch-text-secondary">
        {availabilityDisplay}
      </TableCell>

      <TableCell className="px-3 py-2 align-middle text-center">
        <div className="flex items-center justify-center gap-1.5">
          {saved ? (
            <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          ) : isClosed ? (
            <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">Closed</Badge>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isPending}
                className="h-7 px-2 text-arch-text-secondary hover:text-arch-text-primary hover:bg-arch-accent-charcoal/30"
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClose}
                disabled={isPending || !closeSMR}
                className="h-7 px-2 text-xs border-arch-border text-arch-text-secondary hover:bg-arch-accent-charcoal/30"
              >
                Close
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export const MachineOpsClient = {
  ShiftSelector,
  Row,
}
