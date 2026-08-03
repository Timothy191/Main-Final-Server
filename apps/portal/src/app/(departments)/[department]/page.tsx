import { GlassCard } from '@repo/ui/GlassCard'
import { getDepartmentContext } from '@/lib/dept-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Building2, Sparkles } from 'lucide-react'

export default async function DepartmentDashboard({
  params,
}: {
  params: Promise<{ department: string }>
}) {
  const { department: deptSlug } = await params
  const { dept, deptId, supabase } = await getDepartmentContext({
    department: deptSlug,
  })

  // Fetch personality and details directly from database to show dynamic department info
  const { data: dbDept } = await supabase
    .from('departments')
    .select('personality, display_name, description')
    .eq('id', deptId)
    .single()

  return (
    <ErrorBoundary context={`Department Dashboard: ${deptSlug}`}>
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-arch-accent-charcoal/10 flex items-center justify-center text-arch-accent-charcoal">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-arch-text-primary">
              {dbDept?.display_name || dept.displayName}
            </h2>
            <p className="text-arch-text-muted text-sm">
              {dbDept?.description || dept.description}
            </p>
          </div>
        </div>

        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-arch-accent-charcoal font-medium">
            <Sparkles className="w-5 h-5" />
            <h3>Department Mission & Personality</h3>
          </div>
          <p className="text-arch-text-secondary leading-relaxed bg-arch-surface-secondary/50 p-4 rounded-xl border border-arch-border-subtle">
            {dbDept?.personality || 'No personality defined for this department.'}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-medium text-arch-text-primary mb-4">Department Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-arch-surface-secondary rounded-lg">
              <span className="text-arch-text-muted block mb-1">Slug</span>
              <span className="font-mono text-arch-text-secondary">{deptSlug}</span>
            </div>
            <div className="p-3 bg-arch-surface-secondary rounded-lg">
              <span className="text-arch-text-muted block mb-1">ID</span>
              <span className="font-mono text-arch-text-secondary">{deptId}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </ErrorBoundary>
  )
}
