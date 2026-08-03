import { PageHeader } from '@repo/ui/PageHeader'
import { GlassCard } from '@repo/ui/GlassCard'

export default function AccessCardActionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeader title="Access Card Actions Dashboard" showDate />

      {/* KPIs skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i}>
            <div className="space-y-3">
              <div className="h-4 bg-arch-surface-tertiary rounded w-24" />
              <div className="h-8 bg-arch-surface-tertiary rounded w-16" />
              <div className="h-3 bg-arch-surface-tertiary rounded w-32" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Table skeleton */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-arch-border-default">
          <div className="h-5 bg-arch-surface-tertiary rounded w-32" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-arch-surface-tertiary/50 rounded" />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
