import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Mountain, Ruler, Layers, Drill, ClipboardList, CheckSquare } from 'lucide-react'
import { getGeologyMetrics, getRecentSurveys } from './actions'

async function GeologyMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getGeologyMetrics(deptId)
  const kpis = [
    {
      label: 'Total Surveys',
      value: metrics.totalSurveys.toString(),
      icon: Ruler,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Topographic',
      value: metrics.topographicCount.toString(),
      icon: Mountain,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Grade Control',
      value: metrics.gradeCount.toString(),
      icon: Layers,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Volume Surveys',
      value: metrics.volumeCount.toString(),
      icon: ClipboardList,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      label: 'Peg-Outs',
      value: metrics.pegOutCount.toString(),
      icon: Drill,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Mine Blocks',
      value: metrics.totalBlocks.toString(),
      icon: CheckSquare,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
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

async function RecentSurveysSection({ deptId }: { deptId: string }) {
  const surveys = await getRecentSurveys(deptId, 6)

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Ruler className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Recent Survey Measurements
        </h3>
      </div>
      {surveys.length === 0 ? (
        <p className="text-arch-text-muted text-sm">No survey measurements recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-arch-text-muted text-xs uppercase tracking-wider border-b border-white/10">
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Type</th>
                <th className="text-left pb-2">Block / Location</th>
                <th className="text-right pb-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => (
                <tr
                  key={survey.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 text-arch-text-primary">{survey.surveyDate}</td>
                  <td className="py-2 capitalize">{survey.surveyType}</td>
                  <td className="py-2 text-arch-text-muted">
                    {survey.blockName ?? survey.location ?? '—'}
                  </td>
                  <td className="py-2 text-right text-arch-text-primary font-mono">
                    {survey.measurementValue !== null
                      ? `${survey.measurementValue} ${survey.unit ?? ''}`
                      : '—'}
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

export default async function GeologyDashboardPage() {
  const { deptId } = await getDepartmentContext({ department: 'geology' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-arch-text-primary">Geology & Survey Overview</h2>
        <p className="text-arch-text-muted text-sm">
          {new Date().toLocaleDateString('en-ZA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
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
        <GeologyMetricsSection deptId={deptId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[320px] w-full" />}>
        <RecentSurveysSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
