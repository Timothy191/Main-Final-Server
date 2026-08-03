import { GlassCard } from '@repo/ui/GlassCard'
import { Layers } from 'lucide-react'
import { getMineBlocks } from '../actions'

export default async function MineBlocksPage() {
  const blocks = await getMineBlocks()

  const activeBlocks = blocks.filter((b) => b.active)
  const _inactiveBlocks = blocks.filter((b) => !b.active)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Mine Blocks</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Active and historical block definitions for the site
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-green" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Active Blocks
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">{activeBlocks.length}</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-arch-text-muted" />
            <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
              Total Blocks
            </p>
          </div>
          <p className="text-2xl font-bold text-arch-text-primary mt-2">{blocks.length}</p>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="p-4 border-b border-arch-border-subtle">
          <h3 className="text-lg font-semibold text-arch-text-primary">Block Register</h3>
          <p className="text-sm text-arch-text-muted mt-1">
            Mine blocks used for survey, grade control and production tracking
          </p>
        </div>
        {blocks.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
            <p className="text-sm text-arch-text-muted">No mine blocks defined yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--overlay-dim)]">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-arch-surface-chrome transition-colors">
                    <td className="px-4 py-3 font-semibold text-arch-text-primary font-mono">
                      {block.code}
                    </td>
                    <td className="px-4 py-3 text-arch-text-secondary">{block.name}</td>
                    <td className="px-4 py-3 text-arch-text-muted">{block.siteName ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          block.active
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-arch-surface-tertiary text-arch-text-muted'
                        }`}
                      >
                        {block.active ? 'Active' : 'Inactive'}
                      </span>
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
