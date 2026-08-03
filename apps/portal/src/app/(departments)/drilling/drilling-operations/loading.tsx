import { GlassSkeleton } from '@repo/ui/components/ui/glass-skeleton'

export default function DrillingOperationsLoading() {
  return (
    <div className="space-y-6">
      <GlassSkeleton showHeader rows={2} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <GlassSkeleton rows={2} />
        <GlassSkeleton rows={2} />
        <GlassSkeleton rows={2} />
        <GlassSkeleton rows={2} />
        <GlassSkeleton rows={2} />
        <GlassSkeleton rows={2} />
      </div>
      <GlassSkeleton className="h-96" rows={1} />
    </div>
  )
}
