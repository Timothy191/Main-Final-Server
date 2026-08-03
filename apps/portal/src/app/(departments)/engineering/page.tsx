import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { createReadReplicaClient } from '@repo/supabase/read-replica'
import Link from 'next/link'
import {
  AlertTriangle,
  CircleDot,
  Wrench,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

async function getEngineeringHubData(deptId: string) {
  const db = await createReadReplicaClient()

  const [
    { count: activeBreakdowns },
    { count: resolvedToday },
    { data: recentBreakdowns },
    { count: tireAlerts },
  ] = await Promise.all([
    db
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'active')
      .is('deleted_at', null),
    db
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('status', 'completed')
      .gte('updated_at', new Date(Date.now() - 86400000).toISOString()),
    db
      .from('breakdowns')
      .select('id, machine_name, reason, priority, created_at')
      .eq('department_id', deptId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    Promise.resolve({ count: 0, data: null, error: null }),
  ])

  return {
    activeBreakdowns: activeBreakdowns ?? 0,
    resolvedToday: resolvedToday ?? 0,
    recentBreakdowns: recentBreakdowns || [],
    tireAlerts: tireAlerts ?? 0,
  }
}

export default async function EngineeringDashboardPage() {
  const { deptId } = await getDepartmentContext({
    department: 'engineering',
  })

  const { activeBreakdowns, resolvedToday, recentBreakdowns, tireAlerts } =
    await getEngineeringHubData(deptId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Engineering Hub</h2>
          <p className="text-sm text-arch-text-muted mt-1">
            Breakdowns, tire management &amp; maintenance overview
          </p>
        </div>
        <p className="text-arch-text-muted text-sm">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Secondary Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Breakdowns Card */}
        <Link href="/engineering/breakdowns" className="group">
          <GlassCard className="h-full hover:bg-arch-surface-secondary transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-red/10 text-accent-red">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-arch-text-primary">Breakdowns</h3>
                  <p className="text-sm text-arch-text-muted">
                    Active faults &amp; maintenance issues
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-arch-text-muted group-hover:text-arch-accent-charcoal group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent-red/5 border border-accent-red/10">
                <p className="text-2xl font-bold text-accent-red">{activeBreakdowns}</p>
                <p className="text-xs text-arch-text-muted mt-0.5">Active Breakdowns</p>
              </div>
              <div className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/10">
                <p className="text-2xl font-bold text-accent-green">{resolvedToday}</p>
                <p className="text-xs text-arch-text-muted mt-0.5">Resolved Today</p>
              </div>
            </div>

            {recentBreakdowns.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-arch-text-muted uppercase tracking-wider">
                  Recent Active
                </p>
                {recentBreakdowns.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-2 border-b border-arch-border-subtle last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-arch-text-muted" />
                      <span className="text-sm text-arch-text-secondary">
                        {b.machine_name || 'Unknown Machine'}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        b.priority === 'critical'
                          ? 'bg-accent-red/10 text-accent-red'
                          : b.priority === 'high'
                            ? 'bg-arch-accent-blue/10 text-arch-accent-blue'
                            : 'bg-arch-surface-tertiary text-arch-text-muted'
                      }`}
                    >
                      {b.priority || 'normal'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </Link>

        {/* Tire Management Card */}
        <Link href="/engineering/tire-management" className="group">
          <GlassCard className="h-full hover:bg-arch-surface-secondary transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-arch-accent-blue/10 text-arch-accent-blue">
                  <CircleDot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-arch-text-primary">Tire Management</h3>
                  <p className="text-sm text-arch-text-muted">
                    Inspections, wear tracking &amp; replacements
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-arch-text-muted group-hover:text-arch-accent-charcoal group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-arch-accent-blue/5 border border-arch-accent-blue/10">
                <p className="text-2xl font-bold text-arch-accent-blue">{tireAlerts}</p>
                <p className="text-xs text-arch-text-muted mt-0.5">Tire Alerts</p>
              </div>
              <div className="p-3 rounded-lg bg-arch-surface-tertiary border border-arch-border-subtle">
                <p className="text-2xl font-bold text-arch-text-primary">—</p>
                <p className="text-xs text-arch-text-muted mt-0.5">Due This Week</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-arch-text-muted uppercase tracking-wider">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arch-surface-tertiary border border-arch-border-subtle text-xs text-arch-text-secondary">
                  <ClipboardList className="w-3 h-3" />
                  Log Inspection
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-arch-surface-tertiary border border-arch-border-subtle text-xs text-arch-text-secondary">
                  <TrendingUp className="w-3 h-3" />
                  View Wear Trends
                </span>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  )
}
