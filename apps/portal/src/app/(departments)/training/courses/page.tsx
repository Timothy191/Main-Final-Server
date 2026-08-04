import { GlassCard } from '@repo/ui/GlassCard'
import { BookOpen, Clock, Users, PlayCircle } from 'lucide-react'
import { SearchForm } from '../components/SearchForm'
import { FilterTabs } from '../components/FilterTabs'
import { getCourses } from '../actions'
import { getDepartmentContext } from '@/lib/dept-context'

// AGENT-TRACE: formatCourseDuration is defined locally here to keep it synchronous and avoid Next.js Server Action constraints (where all exported functions in 'use server' files must be async).
function formatCourseDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string }>
}) {
  const { deptId } = await getDepartmentContext({ department: 'training' })
  const { q, category } = (await searchParams) ?? {}

  const courses = await getCourses(deptId, { q, category })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-arch-text-primary">LMS Course Catalog</h2>
          <p className="text-arch-text-muted text-sm mt-0.5">
            Create, manage, and assign technical learning plans and regulatory safety modules.
          </p>
        </div>
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
        {courses.length > 0 ? (
          courses.map((course) => (
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
                    <span>{formatCourseDuration(course.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.enrolledCount} Enrolled</span>
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

                <button className="w-full h-8 flex items-center justify-center gap-1.5 bg-arch-surface-chrome border border-arch-border-default rounded-lg text-xs font-semibold text-arch-text-primary hover:bg-arch-surface-chrome-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/30">
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
