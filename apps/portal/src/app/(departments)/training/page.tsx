import { GlassCard } from '@repo/ui/GlassCard'
import { GraduationCap, Award, Calendar, Clock } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'

export default async function TrainingDashboardPage() {
  await getDepartmentContext({ department: 'training' })
  const stats = [
    {
      label: 'LMS Compliance',
      value: '94.2%',
      change: '+1.4% this month',
      icon: Award,
      color: 'text-emerald-500',
    },
    {
      label: 'Active Trainees',
      value: '42',
      change: '8 onboarding this week',
      icon: GraduationCap,
      color: 'text-cyan-500',
    },
    {
      label: 'Upcoming Sessions',
      value: '7',
      change: '3 scheduled for today',
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      label: 'Hours Logged (MTD)',
      value: '384h',
      change: '+48h vs last month',
      icon: Clock,
      color: 'text-violet-500',
    },
  ]

  const ongoingClasses = [
    {
      id: 1,
      course: 'Underground Equipment Safety V2',
      trainees: 14,
      time: '08:00 - 12:00',
      trainer: 'Sarah Jenkins',
      status: 'In Progress',
    },
    {
      id: 2,
      course: 'HAZMAT & Chemical Handling',
      trainees: 8,
      time: '10:30 - 13:00',
      trainer: 'David Vance',
      status: 'Starting Soon',
    },
    {
      id: 3,
      course: 'Refresher: Excavator Ops',
      trainees: 5,
      time: '14:00 - 16:30',
      trainer: 'Marcus Stone',
      status: 'Scheduled',
    },
  ]

  const recentCertifications = [
    {
      employee: 'Jared Leto',
      role: 'Drill Operator',
      certification: 'Class A Rig Telemetry',
      issueDate: '2026-05-28',
      status: 'Active',
    },
    {
      employee: 'Sarah Connor',
      role: 'Safety Inspector',
      certification: 'Advanced First Aid & Rescue',
      issueDate: '2026-05-26',
      status: 'Active',
    },
    {
      employee: 'Mark Ronson',
      role: 'Haul Dumper Pilot',
      certification: 'HD-785 Mechanical Induction',
      issueDate: '2026-05-25',
      status: 'Active',
    },
    {
      employee: 'Elena Rostova',
      role: 'Excavator Operator',
      certification: 'PC-2000 Operation & Maintenance',
      issueDate: '2026-05-22',
      status: 'Active',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-arch-text-primary">Training Overview & LMS</h2>
        <p className="text-arch-text-muted text-sm">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-xs text-arch-text-muted mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-medium">{stat.change.split(' ')[0]}</span>
                <span>{stat.change.substring(stat.change.indexOf(' '))}</span>
              </p>
            </GlassCard>
          )
        })}
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedules */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <h3 className="font-semibold text-sm text-arch-text-primary">Today's Sessions</h3>
              <Calendar className="w-4 h-4 text-arch-text-muted" />
            </div>
            <div className="mt-4 space-y-4">
              {ongoingClasses.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-arch-surface-chrome border border-arch-border-subtle space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm text-arch-text-primary">{item.course}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        item.status === 'In Progress'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : item.status === 'Starting Soon'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-blue-500/10 text-blue-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-arch-text-muted">
                    <span>{item.trainer}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className="text-[11px] text-arch-text-muted">
                    👥 <span className="font-semibold">{item.trainees} trainees</span> enrolled
                  </div>
                </div>
              ))}
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
                  {recentCertifications.map((cert, idx) => (
                    <tr key={idx} className="hover:bg-arch-surface-chrome">
                      <td className="py-2.5 font-medium text-arch-text-primary">{cert.employee}</td>
                      <td className="py-2.5 text-arch-text-muted">{cert.role}</td>
                      <td className="py-2.5 text-arch-text-primary">{cert.certification}</td>
                      <td className="py-2.5 text-arch-text-muted">{cert.issueDate}</td>
                      <td className="py-2.5 text-right">
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 font-semibold rounded-full">
                          {cert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
