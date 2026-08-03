import { Suspense } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import { Archive, FileText, User, Filter } from 'lucide-react'
import Link from 'next/link'
import { getDepartmentContext } from '@/lib/dept-context'
import { getArchivedDocuments } from '../actions'

const DOC_TYPE_STYLES: Record<string, string> = {
  certificate: 'bg-emerald-500/10 text-emerald-600',
  'training-record': 'bg-blue-500/10 text-blue-600',
  'course-material': 'bg-violet-500/10 text-violet-600',
  assessment: 'bg-amber-500/10 text-amber-600',
  'compliance-report': 'bg-rose-500/10 text-rose-600',
  other: 'bg-arch-surface-tertiary text-arch-text-muted',
}

const DOC_TYPE_FILTERS = [
  'All',
  'certificate',
  'training-record',
  'course-material',
  'assessment',
  'compliance-report',
  'other',
]

async function ArchivedDocumentsSection({ deptId, type }: { deptId: string; type?: string }) {
  const docs = await getArchivedDocuments(deptId)
  const filtered = type && type !== 'All' ? docs.filter((d) => d.documentType === type) : docs

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="p-4 border-b border-arch-border-subtle">
        <h3 className="text-lg font-semibold text-arch-text-primary">Archived Documents</h3>
        <p className="text-sm text-arch-text-muted mt-1">
          Historical certificates, training records, course materials and compliance reports
        </p>
      </div>

      {/* Type filter pills */}
      <div className="px-4 py-3 border-b border-arch-border-subtle flex items-center gap-2 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-arch-text-muted shrink-0" />
        {DOC_TYPE_FILTERS.map((option) => {
          const params = new URLSearchParams()
          if (option !== 'All') params.set('type', option)
          return (
            <Link
              key={option}
              href={`?${params.toString()}`}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all shrink-0 ${
                (type || 'All') === option
                  ? 'bg-[var(--text-heading)] text-white border-transparent'
                  : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
              }`}
            >
              {option.replace('-', ' ')}
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <Archive className="w-12 h-12 mx-auto mb-4 text-arch-text-muted opacity-30" />
          <p className="text-sm text-arch-text-muted">No archived documents match the filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arch-border-subtle text-arch-text-muted font-semibold">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Archived At</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--overlay-dim)]">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-arch-surface-chrome transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-medium text-arch-text-primary">{doc.documentName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${DOC_TYPE_STYLES[doc.documentType] ?? 'bg-arch-surface-tertiary text-arch-text-muted'}`}
                    >
                      {doc.documentType.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-arch-text-muted">
                      <User className="w-3 h-3" />
                      <span>{doc.employeeName ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted font-mono text-[10px]">
                    {doc.archivedAt}
                  </td>
                  <td className="px-4 py-3 text-arch-text-muted italic max-w-[200px] truncate">
                    {doc.notes ?? '—'}
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

export default async function ArchivePage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>
}) {
  const { deptId } = await getDepartmentContext({ department: 'training' })
  const { type } = (await searchParams) ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-arch-text-primary">Archived Documents</h2>
        <p className="text-arch-text-muted text-sm mt-0.5">
          Historical certificates, training records, assessments and compliance reports
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <ArchivedDocumentsSection deptId={deptId} type={type} />
      </Suspense>
    </div>
  )
}
