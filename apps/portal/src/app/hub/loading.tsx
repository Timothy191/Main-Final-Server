import { GlassSkeleton } from '@repo/ui/components/ui/glass-skeleton'

export default function HubLoading() {
  return (
    <div className="space-y-6">
      <GlassSkeleton showHeader rows={2} />
      <GlassSkeleton rows={7} />
    </div>
  )
}
