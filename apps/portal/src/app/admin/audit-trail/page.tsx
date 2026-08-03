import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, getUserSafely } from '@repo/supabase/server'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { ShieldCheck, UserPlus, UserCog, Building2, CalendarClock, UserX } from 'lucide-react'
import { getAuditTrail, getAuditMetrics, type AdminAuditEntry } from './actions'

const ACTION_STYLES: Record<string, string> = {
  'user.created': 'bg-emerald-500/10 text-emerald-600',
  'user.role_changed': 'bg-blue-500/10 text-blue-600',
  'user.department_changed': 'bg-cyan-500/10 text-cyan-600',
  'user.deactivated': 'bg-rose-500/10 text-rose-600',
  'department.created': 'bg-emerald-500/10 text-emerald-600',
  'department.updated': 'bg-violet-500/10 text-violet-600',
  'department.deleted': 'bg-rose-500/10 text-rose-600',
  'shift.created': 'bg-amber-500/10 text-amber-600',
}

function actionIcon(action: string) {
  if (action.includes('created')) return UserPlus
  if (action.includes('role')) return UserCog
  if (action.includes('deactivated')) return UserX
  if (action.includes('deleted')) return UserX
  if (action.includes('department')) return Building2
  return CalendarClock
}

async function AuditMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getAuditMetrics(deptId)
  const kpis = [
    {
      label: 'Total Events',
      value: metrics.total.toString(),
      icon: ShieldCheck,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'User Created',
      value: metrics.userCreated.toString(),
      icon: UserPlus,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Role Changes',
      value: metrics.roleChanges.toString(),
      icon: UserCog,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Deactivations',
      value: metrics.deactivations.toString(),
      icon: UserX,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <GlassCard key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={`p-2 ${kpi.bg} rounded-lg flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-arch-text-primary mt-0.5">{kpi.value}</p>
              </div>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}

async function AuditTable({ deptId }: { deptId: string }) {
  const entries: AdminAuditEntry[] = await getAuditTrail(deptId)
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Audit Trail</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Administrative actions across the platform
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="p-12 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No audit events recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {entries.map((entry) => {
                const Icon = actionIcon(entry.action)
                return (
                  <tr key={entry.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 text-arch-text-muted font-mono text-[10px]">
                      {entry.createdAt}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${ACTION_STYLES[entry.action] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-arch-text-secondary">{entry.entityType}</td>
                    <td className="px-4 py-3 text-arch-text-muted font-mono text-[10px] max-w-[300px] truncate">
                      {entry.details}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  )
}

export default async function AdminAuditTrailPage() {
  const supabase = await createServerSupabaseClient()
  const user = await getUserSafely(supabase)
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('department_id, role')
    .eq('auth_id', user.id)
    .single()
  if (employee?.role !== 'admin' || !employee.department_id) redirect('/hub')

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Admin Audit Trail</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Administrative actions, user lifecycle events and configuration changes
        </p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <AuditMetricsSection deptId={employee.department_id} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AuditTable deptId={employee.department_id} />
      </Suspense>
    </div>
  )
}
