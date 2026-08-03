import { GlassCard } from '@repo/ui/GlassCard'
import { Ruler } from 'lucide-react'
import Link from 'next/link'
import { getDepartmentContext } from '@/lib/dept-context'
import { getSurveyMeasurements } from '../actions'

const TYPE_FILTERS = ['All', 'topographic', 'grade', 'peg-out', 'volume', 'monitoring']

export default async function SurveyPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>
}) {
  const { deptId } = await getDepartmentContext({ department: 'geology' })
  const { type } = (await searchParams) ?? {}

  const surveys = await getSurveyMeasurements(deptId, { type })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Survey Measurements</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Topographic, grade control, volume and peg-out surveys
        </p>
      </div>

      {/* Filters */}
      <GlassCard className="flex items-center gap-2 overflow-x-auto">
        <Ruler className="w-4 h-4 text-arch-text-muted shrink-0" />
        {TYPE_FILTERS.map((option) => {
          const params = new URLSearchParams()
          if (option !== 'All') params.set('type', option)
          return (
            <Link
              key={option}
              href={`?${params.toString()}`}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 capitalize ${
                (type || 'All') === option
                  ? 'bg-[var(--text-heading)] text-white border-transparent'
                  : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
              }`}
            >
              {option}
            </Link>
          )
        })}
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {surveys.length === 0 ? (
          <div className="p-12 text-center">
            <Ruler className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <p className="text-sm text-arch-text-muted">No survey measurements match the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Block / Location</th>
                  <th className="px-4 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {surveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 text-arch-text-primary">{survey.surveyDate}</td>
                    <td className="px-4 py-3 capitalize text-arch-text-secondary">
                      {survey.surveyType}
                    </td>
                    <td className="px-4 py-3 text-arch-text-muted">
                      {survey.blockName ?? survey.location ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-arch-text-primary font-mono">
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
    </div>
  )
}
