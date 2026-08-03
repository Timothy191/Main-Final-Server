import { GlassCard } from '@repo/ui/GlassCard'
import { UserCheck, Star, Users, CheckCircle, Clock } from 'lucide-react'
import { getDepartmentContext } from '@/lib/dept-context'
import { getInstructors } from '../actions'

export default async function InstructorsPage() {
  const { deptId } = await getDepartmentContext({ department: 'training' })
  const instructors = await getInstructors(deptId)

  const activeCount = instructors.filter((i) => i.active).length
  const totalCapacity = instructors.reduce((s, i) => s + i.maxConcurrentSessions, 0)
  const totalCurrent = instructors.reduce((s, i) => s + i.currentSessions, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Training Instructors</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Instructor assignments, specializations and session capacity management
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-accent-green" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Active Instructors
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">{activeCount}</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Total Capacity
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">
            {totalCurrent} / {totalCapacity}
          </p>
          <p className="text-xs text-arch-text-muted mt-1">current sessions</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Avg Rating
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">
            {instructors.length > 0
              ? (instructors.reduce((s, i) => s + (i.rating ?? 0), 0) / instructors.length).toFixed(
                  1
                )
              : '—'}
          </p>
        </GlassCard>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {instructors.length > 0 ? (
          instructors.map((instructor) => (
            <GlassCard
              key={instructor.id}
              className="hover:bg-arch-surface-secondary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-arch-surface-chrome-medium">
                    <UserCheck className="w-5 h-5 text-arch-accent-charcoal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-arch-text-primary">
                      {instructor.instructorName}
                    </h3>
                    <p className="text-xs text-arch-text-muted">
                      {instructor.specialization ?? 'General'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${instructor.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                >
                  {instructor.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {instructor.certifications?.map((cert, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-arch-surface-chrome text-arch-text-secondary font-medium"
                  >
                    {cert}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-arch-border-subtle">
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 text-arch-accent-blue text-lg font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {instructor.currentSessions}/{instructor.maxConcurrentSessions}
                  </p>
                  <p className="text-[10px] text-arch-text-muted">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-amber-500 text-lg font-bold">
                    <Star className="w-3.5 h-3.5 inline-block mr-0.5" />
                    {instructor.rating?.toFixed(1) ?? '—'}
                  </p>
                  <p className="text-[10px] text-arch-text-muted">Rating</p>
                </div>
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 text-accent-green text-lg font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {instructor.certifications?.length ?? 0}
                  </p>
                  <p className="text-[10px] text-arch-text-muted">Certs</p>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-arch-text-muted">
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No instructors registered yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
