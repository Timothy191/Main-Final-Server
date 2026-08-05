import { getDepartmentContext } from '@/lib/dept-context'
import { Cpu, Calendar, Sun, Moon } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { MachineOpsClient } from './MachineOpsClient'
import { MachineOpsTable } from './components/MachineOpsTable'
import { MachineOpsSkeleton } from './components/MachineOpsSkeleton'

export const metadata: Metadata = {
  title: 'Machine Operations | Control Room | Arch OS',
  description: 'SMR-based shift sheet for machine operations.',
}

interface PageProps {
  searchParams?: Promise<{ shiftDate?: string; shiftType?: string }>
}

function getDefaultShift(): { shiftDate: string; shiftType: 'day' | 'night' } {
  const now = new Date()
  const shiftDate = now.toISOString().split('T')[0] ?? ''
  const hour = now.getHours()
  const shiftType: 'day' | 'night' = hour >= 6 && hour < 18 ? 'day' : 'night'
  return { shiftDate, shiftType }
}

export default async function MachineOperationsPage({ searchParams }: PageProps) {
  const { deptId } = await getDepartmentContext({ department: 'control-room' })

  const params = (await searchParams) ?? {}
  const defaultShift = getDefaultShift()
  const shiftDate = params.shiftDate ?? defaultShift.shiftDate
  const shiftType =
    params.shiftType === 'day' || params.shiftType === 'night'
      ? params.shiftType
      : defaultShift.shiftType

  return (
    <div className="space-y-6 max-w-[96rem] mx-auto py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">Machine Operations</h2>
          <p className="text-arch-text-muted text-sm">
            SMR-based shift sheet. Start SMR is pulled from the previous close; close SMR is entered
            per machine.
          </p>
        </div>
        <MachineOpsClient.ShiftSelector shiftDate={shiftDate} shiftType={shiftType} />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent-green/10 rounded-lg text-accent-green">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Machines
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">Live SMR</h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-400/10 rounded-lg text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Shift Date
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5">{shiftDate}</h4>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg ${
                shiftType === 'day'
                  ? 'bg-yellow-400/10 text-yellow-400'
                  : 'bg-indigo-400/10 text-indigo-400'
              }`}
            >
              {shiftType === 'day' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Shift
              </p>
              <h4 className="text-2xl font-bold text-arch-text-primary mt-0.5 capitalize">
                {shiftType}
              </h4>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Shift Sheet */}
      <Suspense fallback={<MachineOpsSkeleton />}>
        <MachineOpsTable deptId={deptId} shiftDate={shiftDate} shiftType={shiftType} />
      </Suspense>
    </div>
  )
}
