'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu'
import { ChevronDown, AlertTriangle, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { HourlyLoadCell } from './HourlyLoadCell'
import {
  bookMachineBreakdown,
  endHaulingSession,
  updateMachineSite,
  updateHourlyLoadMaterial,
  reassignDumperExcavator,
} from '../actions'

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
  created_at: string
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
        id: string
        name: string
        machine_type: string
        bin_factor: number | null
        site:
          | {
              id: string
              name: string
            }[]
          | null
        assignments:
          | {
              created_at: string
              material_type: string
              excavator_activity:
                | {
                    machine:
                      | {
                          id: string
                          name: string
                        }[]
                      | null
                  }[]
                | null
            }[]
          | null
      }[]
    | null
}

interface ExcavatorOption {
  id: string
  name: string
  machine_type: string
  site_id: string | null
}

interface HourlyLoadsTableProps {
  initialLoads: HourlyLoadRow[]
  excavators: ExcavatorOption[]
  sites: { id: string; name: string }[]
}

function getCurrentShiftHour(): number {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 18) {
    return hour - 5
  } else if (hour >= 18) {
    return hour - 17
  } else {
    return hour + 7
  }
}

export function HourlyLoadsTable({ initialLoads, excavators, sites }: HourlyLoadsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedRow, setSelectedRow] = useState<HourlyLoadRow | null>(null)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [isEndSessionOpen, setIsEndSessionOpen] = useState(false)
  const [loadsData, setLoadsData] = useState<HourlyLoadRow[]>(initialLoads)

  useEffect(() => {
    setLoadsData(initialLoads)
  }, [initialLoads])

  const handleCellAdjust = (rowId: string, hourColumn: string, newValue: number) => {
    setLoadsData((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const updatedRow = { ...r, [hourColumn]: newValue }
          const newTotal = HOUR_COLUMNS.reduce((sum, col) => {
            const val = updatedRow[col as keyof HourlyLoadRow] as number
            return sum + (val === -1 || val === null || val === undefined ? 0 : val)
          }, 0)
          updatedRow.total_loads = newTotal
          return updatedRow
        }
        return r
      })
    )
  }

  const handleSiteChange = async (machineId: string | undefined, siteId: string) => {
    if (!machineId) return

    startTransition(async () => {
      try {
        await updateMachineSite(machineId, siteId || null)
        toast.success('Machine site updated successfully')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update site')
      }
    })
  }

  // Pre-group loads by dumper machine ID to index them by creation order
  const loadsByDumper: Record<string, HourlyLoadRow[]> = {}
  loadsData.forEach((row) => {
    const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
    const dId = machine?.id
    if (dId) {
      if (!loadsByDumper[dId]) {
        loadsByDumper[dId] = []
      }
      loadsByDumper[dId].push(row)
    }
  })

  // Sort each group by creation date ascending
  Object.keys(loadsByDumper).forEach((dId) => {
    loadsByDumper[dId]?.sort((a, b) => a.created_at.localeCompare(b.created_at))
  })

  // Collect all distinct material_type values from loadsData (representing admin-created assignments)
  const dynamicMaterials = new Set<string>()
  loadsData.forEach((row) => {
    const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
    if (machine?.assignments) {
      const assignmentsList = Array.isArray(machine.assignments)
        ? machine.assignments
        : [machine.assignments]
      assignmentsList.forEach((assignment: { material_type?: string }) => {
        if (assignment?.material_type) {
          dynamicMaterials.add(assignment.material_type)
        }
      })
    }
  })

  // Basic/default material categories
  const basicCoal = ['Coal (Standard)', 'Coal (High Grade)', 'Coal (Low Grade)']
  const basicWaste = ['Waste (Standard)', 'Overburden', 'Topsoil', 'Parting']

  // Separate dynamic materials into Coal and Waste categories
  const adminCoal: string[] = []
  const adminWaste: string[] = []
  dynamicMaterials.forEach((mat) => {
    if (basicCoal.includes(mat) || basicWaste.includes(mat)) return
    if (mat === 'Coal' || mat === 'Waste') return // Skip primary headers

    if (mat.toLowerCase().includes('coal') || mat.toLowerCase().includes('ore')) {
      adminCoal.push(mat)
    } else {
      adminWaste.push(mat)
    }
  })

  const coalOptions = [...basicCoal, ...adminCoal]
  const wasteOptions = [...basicWaste, ...adminWaste]

  const getExcavatorName = (row: HourlyLoadRow) => {
    const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
    const dId = machine?.id
    if (!dId || !machine?.assignments) return '—'

    // Sort assignments by creation date ascending
    const assignmentsList = Array.isArray(machine.assignments)
      ? [...machine.assignments]
      : [machine.assignments]
    assignmentsList.sort(
      (a: { created_at?: string }, b: { created_at?: string }) =>
        (a.created_at || '').localeCompare(b.created_at || '')
    )

    // Find index of this load row in the dumper's sorted loads list
    const dumperLoads = loadsByDumper[dId] || []
    const index = dumperLoads.findIndex((l) => l.id === row.id)

    if (index !== -1 && index < assignmentsList.length) {
      const assignment = assignmentsList[index]
      const activity = assignment?.excavator_activity
      const activityData = Array.isArray(activity) ? activity[0] : activity
      const excavatorMachine = activityData?.machine
      const excavatorMachineData = Array.isArray(excavatorMachine)
        ? excavatorMachine[0]
        : excavatorMachine
      return excavatorMachineData?.name ?? '—'
    }

    // Fallback to first assignment
    const firstAssignment = assignmentsList[0]
    const activity = firstAssignment?.excavator_activity
    const activityData = Array.isArray(activity) ? activity[0] : activity
    const excavatorMachine = activityData?.machine
    const excavatorMachineData = Array.isArray(excavatorMachine)
      ? excavatorMachine[0]
      : excavatorMachine
    return excavatorMachineData?.name ?? '—'
  }

  const getExcavatorId = (row: HourlyLoadRow) => {
    const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
    const dId = machine?.id
    if (!dId || !machine?.assignments) return ''

    // Sort assignments by creation date ascending
    const assignmentsList = Array.isArray(machine.assignments)
      ? [...machine.assignments]
      : [machine.assignments]
    assignmentsList.sort(
      (a: { created_at?: string }, b: { created_at?: string }) =>
        (a.created_at || '').localeCompare(b.created_at || '')
    )

    // Find index of this load row in the dumper's sorted loads list
    const dumperLoads = loadsByDumper[dId] || []
    const index = dumperLoads.findIndex((l) => l.id === row.id)

    if (index !== -1 && index < assignmentsList.length) {
      const assignment = assignmentsList[index]
      const activity = assignment?.excavator_activity
      const activityData = Array.isArray(activity) ? activity[0] : activity
      const excavatorMachine = activityData?.machine
      const excavatorMachineData = Array.isArray(excavatorMachine)
        ? excavatorMachine[0]
        : excavatorMachine
      return excavatorMachineData?.id ?? ''
    }

    // Fallback to first assignment
    const firstAssignment = assignmentsList[0]
    const activity = firstAssignment?.excavator_activity
    const activityData = Array.isArray(activity) ? activity[0] : activity
    const excavatorMachine = activityData?.machine
    const excavatorMachineData = Array.isArray(excavatorMachine)
      ? excavatorMachine[0]
      : excavatorMachine
    return excavatorMachineData?.id ?? ''
  }

  const getSpecificMaterialName = (row: HourlyLoadRow) => {
    const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
    const dId = machine?.id
    if (!dId || !machine?.assignments)
      return row.material_type === 'Coal' ? coalOptions[0] : wasteOptions[0]

    // Sort assignments by creation date ascending
    const assignmentsList = Array.isArray(machine.assignments)
      ? [...machine.assignments]
      : [machine.assignments]
    assignmentsList.sort(
      (a: { created_at?: string }, b: { created_at?: string }) =>
        (a.created_at || '').localeCompare(b.created_at || '')
    )

    // Find index of this load row in the dumper's sorted loads list
    const dumperLoads = loadsByDumper[dId] || []
    const index = dumperLoads.findIndex((l) => l.id === row.id)

    if (index !== -1 && index < assignmentsList.length) {
      const assignment = assignmentsList[index]
      return (
        assignment?.material_type ??
        (row.material_type === 'Coal' ? coalOptions[0] : wasteOptions[0])
      )
    }

    // Fallback to first assignment
    const firstAssignment = assignmentsList[0]
    return (
      firstAssignment?.material_type ??
      (row.material_type === 'Coal' ? coalOptions[0] : wasteOptions[0])
    )
  }

  const handleMaterialChange = async (
    loadRowId: string,
    primaryMaterial: 'Coal' | 'Waste',
    subMaterial: string
  ) => {
    startTransition(async () => {
      try {
        await updateHourlyLoadMaterial(loadRowId, primaryMaterial, subMaterial)
        toast.success('Material type updated successfully')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update material')
      }
    })
  }

  const handleExcavatorChange = async (loadRowId: string, newExcavatorId: string) => {
    startTransition(async () => {
      try {
        await reassignDumperExcavator(loadRowId, newExcavatorId)
        toast.success('Excavator assignment updated successfully')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update excavator')
      }
    })
  }

  const handleOpenBreakdown = (row: HourlyLoadRow) => {
    setSelectedRow(row)
    setIsBreakdownOpen(true)
  }

  const handleOpenEndSession = (row: HourlyLoadRow) => {
    setSelectedRow(row)
    setIsEndSessionOpen(true)
  }

  const onBookBreakdownSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRow) return

    const machine = Array.isArray(selectedRow.machines)
      ? selectedRow.machines[0]
      : selectedRow.machines
    if (!machine) return

    const formData = new FormData(e.currentTarget)
    const reason = formData.get('reason') as string

    startTransition(async () => {
      try {
        await bookMachineBreakdown(machine.id, machine.name, machine.machine_type, reason)
        toast.success(`Breakdown logged successfully for ${machine.name}`)
        setIsBreakdownOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to book breakdown')
      }
    })
  }

  const onEndSessionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRow) return

    const machine = Array.isArray(selectedRow.machines)
      ? selectedRow.machines[0]
      : selectedRow.machines
    if (!machine) return

    const formData = new FormData(e.currentTarget)
    const stopHour = parseInt(formData.get('stopHour') as string, 10)
    const newMaterial = formData.get('newMaterial') as string
    const newExcavatorId = formData.get('newExcavatorId') as string

    startTransition(async () => {
      try {
        await endHaulingSession(selectedRow.id, stopHour, newMaterial, newExcavatorId)
        toast.success(`Hauling session ended. Created new session from Hour ${stopHour + 1}.`)
        setIsEndSessionOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to end session')
      }
    })
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full text-left border-collapse min-w-[1400px]">
        <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
          <TableRow>
            <TableHead className="px-4 py-3 font-semibold">Machine_Id</TableHead>
            <TableHead className="px-4 py-3 font-semibold">Site</TableHead>
            <TableHead className="px-4 py-3 font-semibold">Excavator</TableHead>
            <TableHead className="px-4 py-3 font-semibold">Material</TableHead>
            {HOUR_COLUMNS.map((_, i) => (
              <TableHead key={i} className="px-1.5 py-3 font-semibold text-center">
                H{String(i + 1).padStart(2, '0')}
              </TableHead>
            ))}
            <TableHead className="px-4 py-3 font-semibold text-right">Total Loads</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-right text-arch-accent-blue">
              Bin Factor
            </TableHead>
            <TableHead className="px-4 py-3 font-semibold text-right text-[var(--accent-orange)]">
              Total Moved
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-sm">
          {loadsData.length > 0 ? (
            loadsData.map((row) => {
              const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines
              const binFactor = machine?.bin_factor ?? 18.5
              const computedTotalLoads = HOUR_COLUMNS.reduce((sum, col) => {
                const val = row[col as keyof HourlyLoadRow] as number
                return sum + (val === -1 || val === null || val === undefined ? 0 : val)
              }, 0)
              const totalMoved = computedTotalLoads * binFactor
              const unit = row.material_type === 'Coal' ? 'Tons' : 'Bcm'

              const siteData = machine
                ? Array.isArray(machine.site)
                  ? machine.site[0]
                  : machine.site
                : null

              return (
                <TableRow
                  key={row.id}
                  className="border-b border-arch-border/50 hover:bg-arch-accent-charcoal/10 transition-colors"
                >
                  <TableCell className="px-4 py-3 font-semibold text-arch-text-primary">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 hover:text-arch-accent-blue transition-colors font-semibold outline-none">
                          {machine?.name || '—'}
                          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="bg-arch-surface-secondary border border-arch-border text-arch-text-primary shadow-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => handleOpenBreakdown(row)}
                          className="flex items-center gap-2 hover:bg-arch-accent-charcoal/20 cursor-pointer px-3 py-2 text-sm"
                        >
                          <AlertTriangle className="h-4 w-4 text-[var(--accent-orange)]" />
                          Book Breakdown
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEndSession(row)}
                          className="flex items-center gap-2 hover:bg-arch-accent-charcoal/20 cursor-pointer px-3 py-2 text-sm"
                        >
                          <LogOut className="h-4 w-4 text-arch-accent-blue" />
                          End Hauling Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-arch-text-secondary">
                    <select
                      value={siteData?.id ?? ''}
                      disabled={isPending}
                      onChange={(e) => handleSiteChange(machine?.id, e.target.value)}
                      className="bg-transparent border border-transparent hover:border-arch-border/50 hover:bg-arch-surface-tertiary focus:bg-arch-surface-tertiary focus:border-arch-accent-blue rounded px-1.5 py-1 text-sm text-arch-text-secondary focus:text-arch-text-primary outline-none transition-all cursor-pointer"
                    >
                      <option
                        value=""
                        disabled
                        className="bg-arch-surface-secondary text-arch-text-muted"
                      >
                        — Select Site —
                      </option>
                      {sites.map((site) => (
                        <option
                          key={site.id}
                          value={site.id}
                          className="bg-arch-surface-secondary text-arch-text-primary"
                        >
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-arch-text-secondary">
                    <select
                      value={getExcavatorId(row)}
                      disabled={isPending}
                      onChange={(e) => handleExcavatorChange(row.id, e.target.value)}
                      className="bg-transparent border border-transparent hover:border-arch-border/50 hover:bg-arch-surface-tertiary focus:bg-arch-surface-tertiary focus:border-arch-accent-blue rounded px-1.5 py-1 text-sm text-arch-text-secondary focus:text-arch-text-primary outline-none transition-all cursor-pointer font-medium"
                    >
                      <option value="" className="bg-arch-surface-secondary text-arch-text-muted">
                        — Select Excavator —
                      </option>
                      {excavators
                        .filter((e) => e.site_id === siteData?.id)
                        .map((excavator) => (
                          <option
                            key={excavator.id}
                            value={excavator.id}
                            className="bg-arch-surface-secondary text-arch-text-primary"
                          >
                            {excavator.name}
                          </option>
                        ))}
                    </select>
                  </TableCell>
                  <TableCell className="px-4 py-3 flex flex-col gap-1 min-w-[150px]">
                    <select
                      value={row.material_type}
                      disabled={isPending}
                      onChange={(e) => {
                        const prim = e.target.value as 'Coal' | 'Waste'
                        const defaultSub = prim === 'Coal' ? coalOptions[0] : wasteOptions[0]
                        if (defaultSub) {
                          handleMaterialChange(row.id, prim, defaultSub)
                        }
                      }}
                      className="bg-transparent border border-transparent hover:border-arch-border/50 hover:bg-arch-surface-tertiary focus:bg-arch-surface-tertiary focus:border-arch-accent-blue rounded px-1.5 py-0.5 text-sm text-arch-text-primary outline-none transition-all cursor-pointer font-bold"
                    >
                      <option
                        value="Waste"
                        className="bg-arch-surface-secondary text-arch-text-primary"
                      >
                        Waste
                      </option>
                      <option
                        value="Coal"
                        className="bg-arch-surface-secondary text-arch-text-primary"
                      >
                        Coal
                      </option>
                    </select>
                    <select
                      value={getSpecificMaterialName(row)}
                      disabled={isPending}
                      onChange={(e) => {
                        handleMaterialChange(
                          row.id,
                          row.material_type as 'Coal' | 'Waste',
                          e.target.value
                        )
                      }}
                      className="bg-transparent border border-transparent hover:border-arch-border/30 hover:bg-arch-surface-tertiary focus:bg-arch-surface-tertiary focus:border-arch-accent-blue rounded px-1.5 py-0.25 text-xs text-arch-text-secondary outline-none transition-all cursor-pointer"
                    >
                      {(row.material_type === 'Coal' ? coalOptions : wasteOptions).map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          className="bg-arch-surface-secondary text-arch-text-primary"
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  {HOUR_COLUMNS.map((col) => (
                    <TableCell key={col} className="px-1 py-2 text-center">
                      <HourlyLoadCell
                        id={row.id}
                        hourColumn={col}
                        value={row[col as keyof HourlyLoadRow] as number}
                        onAdjusted={(result) => {
                          handleCellAdjust(row.id, col, result.newValue)
                          router.refresh()
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-3 text-right font-bold text-arch-text-primary">
                    {computedTotalLoads}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-medium text-arch-accent-blue">
                    {binFactor.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-bold text-[var(--accent-orange)] whitespace-nowrap">
                    {totalMoved.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}{' '}
                    <span className="text-xs font-semibold opacity-80">{unit}</span>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={20} className="px-4 py-8 text-center text-arch-text-muted">
                No loads recorded for today.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Book Breakdown Modal */}
      {isBreakdownOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-arch-surface-secondary border border-arch-border p-6 rounded-lg w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-arch-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="text-[var(--accent-orange)]" />
              Book Breakdown for {selectedRow.machines?.[0]?.name}
            </h3>
            <form onSubmit={onBookBreakdownSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-arch-text-secondary uppercase tracking-wider mb-1.5">
                  Reason / Symptoms
                </label>
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder="e.g. Engine transmission fault, hydraulic leak, flat tire..."
                  className="w-full bg-arch-surface-tertiary border border-arch-border rounded-md px-3 py-2 text-sm text-arch-text-primary focus:outline-none focus:border-arch-accent-blue"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBreakdownOpen(false)}
                  className="px-4 py-2 border border-arch-border text-arch-text-secondary hover:bg-arch-surface-tertiary rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Confirm Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Hauling Session Modal */}
      {isEndSessionOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-arch-surface-secondary border border-arch-border p-6 rounded-lg w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-arch-text-primary mb-4 flex items-center gap-2">
              <LogOut className="text-arch-accent-blue" />
              End Hauling Session: {selectedRow.machines?.[0]?.name}
            </h3>
            <form onSubmit={onEndSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-arch-text-secondary uppercase tracking-wider mb-1.5">
                  End Shift Hour
                </label>
                <select
                  name="stopHour"
                  required
                  defaultValue={getCurrentShiftHour()}
                  className="w-full bg-arch-surface-tertiary border border-arch-border rounded-md px-3 py-2 text-sm text-arch-text-primary focus:outline-none focus:border-arch-accent-blue"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      Hour {i + 1}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-arch-text-muted mt-1">
                  Hours after this stop hour will be locked in the current session.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-arch-text-secondary uppercase tracking-wider mb-1.5">
                  New Session Material
                </label>
                <select
                  name="newMaterial"
                  required
                  defaultValue="Waste"
                  className="w-full bg-arch-surface-tertiary border border-arch-border rounded-md px-3 py-2 text-sm text-arch-text-primary focus:outline-none focus:border-arch-accent-blue"
                >
                  <option value="Waste">Waste</option>
                  <option value="Coal">Coal</option>
                  <option value="Ore">Ore</option>
                  <option value="Overburden">Overburden</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-arch-text-secondary uppercase tracking-wider mb-1.5">
                  New Session Excavator / Shovel
                </label>
                <select
                  name="newExcavatorId"
                  required
                  className="w-full bg-arch-surface-tertiary border border-arch-border rounded-md px-3 py-2 text-sm text-arch-text-primary focus:outline-none focus:border-arch-accent-blue"
                >
                  <option value="">-- Select Excavator --</option>
                  {excavators.map((excavator) => (
                    <option key={excavator.id} value={excavator.id}>
                      {excavator.name} ({excavator.machine_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEndSessionOpen(false)}
                  className="px-4 py-2 border border-arch-border text-arch-text-secondary hover:bg-arch-surface-tertiary rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-arch-accent-blue hover:bg-arch-accent-blue/90 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Split Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
