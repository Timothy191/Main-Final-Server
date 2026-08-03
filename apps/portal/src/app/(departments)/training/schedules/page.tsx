import { GlassCard } from '@repo/ui/GlassCard'
import { Calendar, Clock, MapPin, User, Plus } from 'lucide-react'
import { SearchForm } from '../components/SearchForm'
import { FilterTabs } from '../components/FilterTabs'

interface Schedule {
  id: number
  course: string
  location: string
  date: string
  time: string
  instructor: string
  capacity: string
  filled: number
  type: 'Mandatory' | 'Refresher' | 'Voluntary'
  status: 'Confirmed' | 'Tentative'
}

const initialSchedules: Schedule[] = [
  {
    id: 1,
    course: 'Underground Equipment Safety V2',
    location: 'South Pit Simulator & Training Suite B',
    date: '2026-06-01',
    time: '08:00 - 12:00',
    instructor: 'Sarah Jenkins',
    capacity: '15',
    filled: 14,
    type: 'Mandatory',
    status: 'Confirmed',
  },
  {
    id: 2,
    course: 'HAZMAT & Chemical Handling',
    location: 'Main Boardroom (Admin Block)',
    date: '2026-06-01',
    time: '10:30 - 13:00',
    instructor: 'David Vance',
    capacity: '10',
    filled: 8,
    type: 'Mandatory',
    status: 'Confirmed',
  },
  {
    id: 3,
    course: 'Refresher: Excavator Ops',
    location: 'North Quarry Excavation Field',
    date: '2026-06-01',
    time: '14:00 - 16:30',
    instructor: 'Marcus Stone',
    capacity: '6',
    filled: 5,
    type: 'Refresher',
    status: 'Confirmed',
  },
  {
    id: 4,
    course: 'First Aid Level 1 Certification',
    location: 'Emergency Response Hub - Training Lab',
    date: '2026-06-03',
    time: '09:00 - 17:00',
    instructor: 'Dr. Amanda Ross',
    capacity: '12',
    filled: 12,
    type: 'Mandatory',
    status: 'Confirmed',
  },
  {
    id: 5,
    course: 'HD-785 Mechanical Induction',
    location: 'Workshop Bay 4 Training Deck',
    date: '2026-06-04',
    time: '13:00 - 16:00',
    instructor: 'Toby Miller',
    capacity: '8',
    filled: 3,
    type: 'Refresher',
    status: 'Tentative',
  },
  {
    id: 6,
    course: 'Advanced Drill Telemetry (LMS Walkthrough)',
    location: 'Training Room A (E-Learning Wing)',
    date: '2026-06-08',
    time: '10:00 - 11:30',
    instructor: 'Jared Leto',
    capacity: '20',
    filled: 16,
    type: 'Voluntary',
    status: 'Confirmed',
  },
]

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string }>
}) {
  const { q, type } = (await searchParams) ?? {}

  const filteredSchedules = initialSchedules.filter((s) => {
    const matchesSearch =
      !q ||
      s.course.toLowerCase().includes(q.toLowerCase()) ||
      s.instructor.toLowerCase().includes(q.toLowerCase()) ||
      s.location.toLowerCase().includes(q.toLowerCase())
    const matchesType = !type || type === 'All' || s.type === type
    return matchesSearch && matchesType
  })

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
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-arch-accent-charcoal text-[var(--bg-secondary)] text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-card">
          <Plus className="w-4 h-4" />
          <span>Book Session</span>
        </button>
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
          filteredSchedules.map((session) => (
            <GlassCard
              key={session.id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-black/20 transition-all duration-300"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                      session.type === 'Mandatory'
                        ? 'bg-red-500/10 text-red-600 font-bold'
                        : session.type === 'Refresher'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-blue-500/10 text-blue-600'
                    }`}
                  >
                    {session.type}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-arch-surface-chrome text-arch-text-muted`}
                  >
                    {session.status}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-arch-text-primary">{session.course}</h3>

                {/* Details line */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-arch-text-muted mt-1.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{session.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      Trainer:{' '}
                      <strong className="font-medium text-arch-text-secondary">
                        {session.instructor}
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
                      width: `${(session.filled / Number(session.capacity)) * 100}%`,
                    }}
                  />
                </div>
                <button className="h-8 px-3 text-xs bg-arch-surface-chrome border border-arch-border-default hover:bg-arch-surface-chrome-medium font-semibold text-arch-text-primary rounded-lg transition-colors">
                  Manage Roster
                </button>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="py-12 text-center text-arch-text-muted">No training sessions found.</div>
        )}
      </div>
    </div>
  )
}
