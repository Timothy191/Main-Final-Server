import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { CircleDot, Plus, Wrench, ClipboardList } from 'lucide-react'

export default async function TireManagementPage() {
  await getDepartmentContext({
    department: 'engineering',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Tire Management</h2>
          <p className="text-sm text-arch-text-muted mt-1">
            Inspections, wear tracking &amp; replacement scheduling
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-arch-accent-charcoal hover:bg-arch-accent-charcoal/90 text-white text-sm font-medium transition-[opacity,transform] hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Log Inspection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-accent-green" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Total Tires
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">—</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-arch-accent-blue" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Due for Service
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-accent-blue mt-2">—</p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent-red" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Critical Alerts
            </p>
          </div>
          <p className="text-2xl font-bold text-accent-red mt-2">—</p>
        </GlassCard>
      </div>

      <GlassCard className="p-12 text-center">
        <CircleDot className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
        <h3 className="text-lg font-semibold text-arch-text-primary mb-2">
          Tire Management Module
        </h3>
        <p className="text-sm text-arch-text-muted max-w-md mx-auto">
          This module will track tire inspections, tread depth, pressure monitoring, and replacement
          schedules for the fleet. Database table pending creation.
        </p>
      </GlassCard>
    </div>
  )
}
