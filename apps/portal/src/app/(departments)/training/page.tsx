import { GlassCard } from '@repo/ui/GlassCard'
import { GraduationCap, Award, Calendar, Clock, UserCheck } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import {
  getTrainingMetrics,
  getRecentCertifications,
  getUpcomingSessions,
  getTraineeMetrics,
  getInstructors,
} from './actions'

import { CreateCourseDialog } from './components/CreateCourseDialog'
import { EnrollEmployeeDialog } from './components/EnrollEmployeeDialog'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  expiring: 'bg-amber-500/10 text-amber-600',
  expired: 'bg-rose-500/10 text-rose-600',
}

export default async function TrainingDashboardPage() {
  const { deptId } = await getDepartmentContext({ department: 'training' })

  const [metrics, recentCertifications, upcomingSessions, traineeMetrics, instructors] =
    await Promise.all([
      getTrainingMetrics(deptId),
      getRecentCertifications(deptId, 6),
      getUpcomingSessions(deptId, 4),
      getTraineeMetrics(deptId),
      getInstructors(deptId),
    ])

  const activeInstructors = instructors.filter((i) => i.active).length

  const stats = [
    {
      label: 'LMS Compliance',
      value: `${metrics.lmsCompliance.toFixed(1)}%`,
      change: 'across active course catalog',
      icon: Award,
      color: 'text-emerald-500',
    },
    {
      label: 'Active Trainees',
      value: traineeMetrics.activeTrainees.toString(),
      change: `${traineeMetrics.coursesInProgress} courses in progress`,
      icon: GraduationCap,
      color: 'text-cyan-500',
    },
    {
      label: 'Upcoming Sessions',
      value: metrics.upcomingSessions.toString(),
      change: 'scheduled & not cancelled',
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      label: 'Hours Logged (MTD)',
      value: `${metrics.hoursLoggedMtd}h`,
      change: 'from scheduled sessions',
      icon: Clock,
      color: 'text-violet-500',
    },
    {
      label: 'Avg Trainee Score',
      value: `${traineeMetrics.avgScore}%`,
      change: 'across all active trainees',
      icon: Award,
      color: 'text-amber-500',
    },
    {
      label: 'Active Instructors',
      value: `${activeInstructors} / ${instructors.length}`,
      change: 'currently assigned',
      icon: UserCheck,
      color: 'text-blue-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Training Overview & LMS</h2>
          <p className="text-arch-text-muted text-xs mt-0.5">
            Competency tracking, course catalog, and employee certification management
          </p>
        </div>
        <CreateCourseDialog deptId={deptId} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <GlassCard key={i}>
              <div className="flex items-center justify-between">
                <p className="text-arch-text-muted text-xs font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-arch-text-primary mt-2">{stat.value}</p>
              <p className="text-xs text-arch-text-muted mt-1">{stat.change}</p>
            </GlassCard>
          )
        })}
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <h3 className="font-semibold text-sm text-arch-text-primary">Upcoming Sessions</h3>
              <Calendar className="w-4 h-4 text-arch-text-muted" />
            </div>
            <div className="mt-4 space-y-4">
              {upcomingSessions.length === 0 ? (
                <p className="text-arch-text-muted text-sm">
                  No upcoming training sessions scheduled.
                </p>
              ) : (
                upcomingSessions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-arch-surface-chrome border border-arch-border-subtle space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm text-arch-text-primary">
                        {item.courseName}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          item.status === 'Confirmed'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-arch-text-muted">
                      <span>{item.instructor ?? 'TBA'}</span>
                      <span>
                        {item.startTime ?? ''}
                        {item.endTime ? ` - ${item.endTime}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-arch-text-muted pt-1 border-t border-white/5">
                      <div>
                        📅 {item.sessionDate} · 👥{' '}
                        <span className="font-semibold">{item.filled}</span>/{item.capacity}
                      </div>
                      <EnrollEmployeeDialog scheduleId={item.id} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Recent Certifications */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="font-semibold text-sm text-arch-text-primary">
                  Recent Certification Awards
                </h3>
                <p className="text-arch-text-muted text-[11px]">
                  Latest safety and equipment competence endorsements
                </p>
              </div>
              <Award className="w-4 h-4 text-arch-text-muted" />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.04] text-arch-text-muted font-semibold">
                    <th className="pb-2">Employee</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Endorsement / Certification</th>
                    <th className="pb-2">Issued</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--overlay-dim)]">
                  {recentCertifications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-arch-text-muted">
                        No certifications issued yet.
                      </td>
                    </tr>
                  ) : (
                    recentCertifications.map((cert) => (
                      <tr key={cert.id} className="hover:bg-arch-surface-chrome">
                        <td className="py-2.5 font-medium text-arch-text-primary">
                          {cert.employeeName}
                        </td>
                        <td className="py-2.5 text-arch-text-muted">{cert.role ?? '—'}</td>
                        <td className="py-2.5 text-arch-text-primary">{cert.certification}</td>
                        <td className="py-2.5 text-arch-text-muted">{cert.issueDate}</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`text-[10px] px-2 py-0.5 font-semibold rounded-full ${
                              STATUS_STYLES[cert.status] ??
                              'bg-arch-surface-tertiary text-arch-text-muted'
                            }`}
                          >
                            {cert.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
