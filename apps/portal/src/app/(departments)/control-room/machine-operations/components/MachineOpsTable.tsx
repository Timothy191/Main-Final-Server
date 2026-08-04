import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui/components/ui/table'
import { GlassCard } from '@repo/ui/GlassCard'
import { getMachineOperationsForShift, getMachineOperationOptions } from '../../actions'
import { MachineOpsClient } from '../MachineOpsClient'

interface MachineOpsTableProps {
  deptId: string
  shiftDate: string
  shiftType: 'day' | 'night'
}

export async function MachineOpsTable({ deptId, shiftDate, shiftType }: MachineOpsTableProps) {
  const [rows, options] = await Promise.all([
    getMachineOperationsForShift(deptId, shiftDate, shiftType),
    getMachineOperationOptions(deptId),
  ])

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full text-left border-collapse min-w-full">
          <TableHeader className="bg-arch-accent-charcoal/30 border-b border-arch-border text-arch-text-secondary text-sm">
            <TableRow>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap">Machine</TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap">Site</TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Start SMR
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Close SMR
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Total
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap">Operator</TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Natural
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Non-Prod
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Production
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Engineering
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Utilization
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-right">
                Availability
              </TableHead>
              <TableHead className="px-3 py-3 font-semibold whitespace-nowrap text-center">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {rows.length > 0 ? (
              rows.map((row) => (
                <MachineOpsClient.Row
                  key={row.machineId}
                  row={row}
                  sites={options.sites}
                  operators={options.operators}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={13} className="px-4 py-8 text-center text-arch-text-muted">
                  No active machines found for this department.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}
