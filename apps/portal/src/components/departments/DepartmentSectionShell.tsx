import { GlassCard } from '@repo/ui/GlassCard'
import { LayoutTemplate } from 'lucide-react'

interface DepartmentSectionShellProps {
  title: string
  description?: string
}

/**
 * Thin navigable placeholder for department tabs that are linked but not fully built.
 */
export function DepartmentSectionShell({ title, description }: DepartmentSectionShellProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-arch-accent-charcoal/10 flex items-center justify-center text-arch-accent-charcoal">
          <LayoutTemplate className="w-6 h-6" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-arch-text-primary">{title}</h2>
          <p className="text-arch-text-muted text-sm">
            {description ?? 'This section is ready for navigation. Feature content will land here.'}
          </p>
        </div>
      </div>
      <GlassCard className="p-6">
        <p className="text-sm text-arch-text-secondary">
          You can open this tab from the hub and department sidebar without being redirected away.
        </p>
      </GlassCard>
    </div>
  )
}
