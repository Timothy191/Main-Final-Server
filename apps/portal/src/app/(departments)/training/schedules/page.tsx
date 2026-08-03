import { GlassCard } from '@repo/ui/GlassCard'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { SearchForm } from '../components/SearchForm'
import { FilterTabs } from '../components/FilterTabs'
import { getSchedules } from '../actions'
import { getDepartmentContext } from '@/lib/dept-context'

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string }>
}) {
  const { deptId } = await getDepartmentContext({ department: 'training' })
  const { q, type } = (await searchParams) ?? {}

  const filteredSchedules = await getSchedules(deptId, { q, type })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">Training Schedules</h2>
          <p className="text-arch-text-muted text-sm mt-0.5">
            Book classrooms, configure instructors, and schedule heavy equipment practical
            evaluations.
          </p>
        </div>
      </div>

      {/* Filters and search panel */}
      <GlassCard className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchForm
          value={q}
          placeholder="Search sessions..."
          hiddenParams={type && type !== 'All' ? { type } : {}}
        />
        <FilterTabs
          paramName="type"
          options={['All', 'Mandatory', 'Refresher', 'Voluntary']}
          currentValue={type || 'All'}
          hiddenParams={q ? { q } : {}}
        />
      </GlassCard>

      {/* Schedules List */}
      <div className="space-y-4">
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((session) => {
            const timeLabel =
              session.startTime && session.endTime
                ? `${session.startTime} - ${session.endTime}`
                : (session.startTime ?? '—')
            return (
              <GlassCard
                key={session.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-black/20 transition-all duration-300"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                        session.sessionType === 'Mandatory'
                          ? 'bg-red-500/10 text-red-600 font-bold'
                          : session.sessionType === 'Refresher'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-blue-500/10 text-blue-600'
                      }`}
                    >
                      {session.sessionType}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                        session.status === 'Cancelled'
                          ? 'bg-rose-500/10 text-rose-600'
                          : session.status === 'Tentative'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-arch-surface-chrome text-arch-text-muted'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-arch-text-primary">
                    {session.courseName}
                  </h3>

                  {/* Details line */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-arch-text-muted mt-1.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{session.sessionDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{session.location ?? 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>
                        Trainer:{' '}
                        <strong className="font-medium text-arch-text-secondary">
                          {session.instructor ?? 'TBA'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Registration statistics */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-black/[0.04] shrink-0 gap-3">
                  <div className="text-left md:text-right space-y-0.5">
                    <p className="text-[10px] text-arch-text-muted font-semibold uppercase tracking-wider">
                      Registrations
                    </p>
                    <p className="text-sm font-semibold text-arch-text-primary">
                      {session.filled} / {session.capacity} Slots
                    </p>
                  </div>
                  <div className="w-24 bg-arch-surface-chrome-medium h-1.5 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-arch-accent-charcoal rounded-full"
                      style={{
                        width: `${session.capacity > 0 ? (session.filled / session.capacity) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </GlassCard>
            )
          })
        ) : (
          <div className="py-12 text-center text-arch-text-muted">No training sessions found.</div>
        )}
      </div>
    </div>
  )
}
