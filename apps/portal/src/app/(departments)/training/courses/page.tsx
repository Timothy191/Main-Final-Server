import { GlassCard } from '@repo/ui/GlassCard'
import { BookOpen, Clock, Users, PlayCircle, Plus } from 'lucide-react'
import { SearchForm } from '../components/SearchForm'
import { FilterTabs } from '../components/FilterTabs'

interface Course {
  id: number
  title: string
  category: 'Safety' | 'Equipment' | 'Induction' | 'Compliance'
  lessons: number
  duration: string
  enrolled: number
  completionRate: number
  description: string
  level: 'Basic' | 'Intermediate' | 'Advanced'
}

const initialCourses: Course[] = [
  {
    id: 1,
    title: 'Underground Equipment Safety V2',
    category: 'Safety',
    lessons: 8,
    duration: '4h 30m',
    enrolled: 24,
    completionRate: 88,
    description:
      'Standard safety protocols for operating equipment in high-risk underground extraction areas.',
    level: 'Intermediate',
  },
  {
    id: 2,
    title: 'HAZMAT & Chemical Handling',
    category: 'Safety',
    lessons: 6,
    duration: '3h 15m',
    enrolled: 15,
    completionRate: 92,
    description:
      'Regulatory compliance and emergency drills for managing site chemicals and hazardous wastes.',
    level: 'Advanced',
  },
  {
    id: 3,
    title: 'PC-2000 Operation & Maintenance',
    category: 'Equipment',
    lessons: 12,
    duration: '8h 00m',
    enrolled: 9,
    completionRate: 75,
    description:
      'Detailed system walk-around, hydraulic telemetry, and advanced operation methods for Komatsu PC-2000.',
    level: 'Advanced',
  },
  {
    id: 4,
    title: 'HD-785 Haul Dumper Induction',
    category: 'Equipment',
    lessons: 10,
    duration: '6h 45m',
    enrolled: 18,
    completionRate: 83,
    description:
      'In-cab simulation, braking physics, loading alignment, and daily inspection checklists for HD-785 dumps.',
    level: 'Intermediate',
  },
  {
    id: 5,
    title: 'Mine Site General Induction',
    category: 'Induction',
    lessons: 5,
    duration: '2h 00m',
    enrolled: 32,
    completionRate: 100,
    description:
      'Mandatory general entry induction briefing covering core policies, safety controls, and facility layouts.',
    level: 'Basic',
  },
  {
    id: 6,
    title: 'High-Voltage Isolation Protocols',
    category: 'Compliance',
    lessons: 9,
    duration: '5h 30m',
    enrolled: 7,
    completionRate: 60,
    description:
      'LOTO procedures, electrical shock risk matrices, and multi-point panel isolation operations.',
    level: 'Advanced',
  },
]

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = (await searchParams) ?? {}

  const filteredCourses = initialCourses.filter((c) => {
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      c.description.toLowerCase().includes(q.toLowerCase())
    const matchesCategory = !category || category === 'All' || c.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">LMS Course Catalog</h2>
          <p className="text-arch-text-muted text-sm mt-0.5">
            Create, manage, and assign technical learning plans and regulatory safety modules.
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-arch-accent-charcoal text-[var(--bg-secondary)] text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-card">
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {/* Filters & Search */}
      <GlassCard className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchForm
          value={q}
          placeholder="Search courses..."
          hiddenParams={category && category !== 'All' ? { category } : {}}
        />
        <FilterTabs
          paramName="category"
          options={['All', 'Safety', 'Equipment', 'Induction', 'Compliance']}
          currentValue={category || 'All'}
          hiddenParams={q ? { q } : {}}
        />
      </GlassCard>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <GlassCard
              key={course.id}
              className="flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-300"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      course.category === 'Safety'
                        ? 'bg-red-500/10 text-red-600'
                        : course.category === 'Equipment'
                          ? 'bg-blue-500/10 text-blue-600'
                          : course.category === 'Induction'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-violet-500/10 text-violet-600'
                    }`}
                  >
                    {course.category}
                  </span>
                  <span className="text-[10px] text-arch-text-muted font-medium">
                    {course.level}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-base text-arch-text-primary line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-arch-text-muted text-xs mt-1 line-clamp-3 h-12 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-black/[0.04] space-y-4">
                <div className="flex items-center justify-between text-[11px] text-arch-text-muted">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{course.lessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.enrolled} Enrolled</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-arch-text-muted font-medium">Compliance Rate</span>
                    <span className="font-semibold text-arch-text-primary">
                      {course.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-arch-surface-chrome-medium h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        course.completionRate > 85
                          ? 'bg-emerald-500'
                          : course.completionRate > 70
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>
                </div>

                <button className="w-full h-8 flex items-center justify-center gap-1.5 bg-arch-surface-chrome border border-arch-border-default rounded-lg text-xs font-semibold text-arch-text-primary hover:bg-arch-surface-chrome-medium transition-colors">
                  <PlayCircle className="w-4 h-4 text-arch-text-muted" />
                  <span>Configure Modules</span>
                </button>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-arch-text-muted">
            No courses found matching your query.
          </div>
        )}
      </div>
    </div>
  )
}
