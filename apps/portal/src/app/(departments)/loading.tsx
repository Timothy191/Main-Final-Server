import { GlassSkeleton } from '@repo/ui/components/ui/glass-skeleton'

export default function DepartmentLoading() {
  return (
    <div className="space-y-6">
      <GlassSkeleton showHeader rows={2} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassSkeleton rows={3} />
        <GlassSkeleton rows={2} />
        <GlassSkeleton rows={3} />
      </div>
      <GlassSkeleton className="h-64" rows={1} />
    </div>
  )
}
