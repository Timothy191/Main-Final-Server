import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Users, GraduationCap, BookOpen, Star, Clock, TrendingUp } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getTrainees, getTraineeMetrics } from '../actions'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  inactive: 'bg-amber-500/10 text-amber-600',
  suspended: 'bg-rose-500/10 text-rose-600',
  graduated: 'bg-blue-500/10 text-blue-600',
}

async function TraineeMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getTraineeMetrics(deptId)
  const kpis = [
    {
      label: 'Total Trainees',
      value: metrics.totalTrainees.toString(),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Active',
      value: metrics.activeTrainees.toString(),
      icon: GraduationCap,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Courses In Progress',
      value: metrics.coursesInProgress.toString(),
      icon: BookOpen,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Avg Score',
      value: `${metrics.avgScore}%`,
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Total Hours Logged',
      value: `${Math.round(metrics.totalHours)}h`,
      icon: Clock,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
    },
    {
      label: 'Graduated',
      value: metrics.graduatedTrainees.toString(),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

async function TraineesTable({ deptId }: { deptId: string }) {
  const trainees = await getTrainees(deptId)

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Trainee Register</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Enrolled personnel, course progress and competency metrics
        </p>
      </div>
      {trainees.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No trainees enrolled yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Trainee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Completed</th>
                <th className="px-4 py-3 text-right">In Progress</th>
                <th className="px-4 py-3 text-right">Total Hours</th>
                <th className="px-4 py-3 text-right">Avg Score</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {trainees.map((trainee) => (
                <tr key={trainee.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3 font-medium text-arch-text-primary">
                    {trainee.employeeName}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted">{trainee.role ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-arch-text-primary">
                    {trainee.coursesCompleted}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-arch-accent-blue font-semibold">
                      {trainee.coursesInProgress}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-arch-text-secondary">
                    {trainee.totalHoursLogged}h
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trainee.avgScore !== null ? (
                      <span
                        className={`font-semibold ${
                          trainee.avgScore >= 85
                            ? 'text-accent-green'
                            : trainee.avgScore >= 70
                              ? 'text-amber-600'
                              : 'text-accent-red'
                        }`}
                      >
                        {trainee.avgScore}%
                      </span>
                    ) : (
                      <span className="text-arch-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        STATUS_STYLES[trainee.status] ??
                        'bg-arch-surface-tertiary text-arch-text-muted'
                      }`}
                    >
                      {trainee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  )
}

export default async function TraineesPage() {
  const { deptId } = await getDepartmentContext({ department: 'training' })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Trainees</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Enrolled personnel, course progress tracking and competency metrics
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <TraineeMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <TraineesTable deptId={deptId} />
      </Suspense>
    </div>
  )
}
