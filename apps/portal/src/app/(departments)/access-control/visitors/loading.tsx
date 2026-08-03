import { GlassCard } from '@repo/ui/GlassCard'

export default function VisitorsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-arch-surface-tertiary/60 rounded animate-pulse" />
          <div className="h-4 w-96 bg-arch-surface-tertiary/60 rounded mt-2 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form Skeleton (Left, 1 col) */}
        <div className="lg:col-span-1">
          <GlassCard>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-9 h-9 bg-arch-surface-tertiary/60 rounded-lg animate-pulse" />
              <div className="h-5 w-32 bg-arch-surface-tertiary/60 rounded animate-pulse" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-arch-surface-tertiary/40 rounded animate-pulse" />
                  <div className="h-10 w-full bg-arch-surface-tertiary/60 rounded animate-pulse" />
                </div>
              ))}
              <div className="pt-4">
                <div className="h-10 w-full bg-arch-surface-tertiary/80 rounded animate-pulse" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Active Visitors Table Skeleton (Right, 2 cols) */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden h-full">
            <div className="p-4 border-b border-arch-border-default bg-arch-surface-secondary/50 flex justify-between items-center">
              <div className="h-5 w-40 bg-arch-surface-tertiary/60 rounded animate-pulse" />
              <div className="h-3 w-24 bg-arch-surface-tertiary/40 rounded animate-pulse" />
            </div>
            <div className="p-0">
              <div className="border-b border-arch-border-default">
                <div className="grid grid-cols-5 p-4 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-4 bg-arch-surface-tertiary/40 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[var(--border-default)]/50">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                  <div key={row} className="grid grid-cols-5 p-4 gap-4">
                    <div className="h-4 bg-arch-surface-tertiary/60 rounded animate-pulse col-span-1" />
                    <div className="h-4 bg-arch-surface-tertiary/40 rounded animate-pulse col-span-1" />
                    <div className="h-4 bg-arch-surface-tertiary/40 rounded animate-pulse col-span-1" />
                    <div className="h-4 bg-arch-surface-tertiary/40 rounded animate-pulse col-span-1" />
                    <div className="h-4 bg-arch-surface-tertiary/60 rounded animate-pulse col-span-1 ml-auto w-16" />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
