import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function StandaloneQuickviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <Link
        href="/hub"
        className="inline-flex items-center gap-2 text-sm text-arch-text-muted hover:text-arch-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Hub
      </Link>

      <div className="bg-arch-surface-primary border border-arch-border-subtle rounded-2xl p-8 shadow-lg space-y-4">
        <h1 className="text-3xl font-bold text-arch-text-primary">Standalone Quickview Detail</h1>
        <p className="text-sm font-mono text-arch-text-muted">Resource ID: {id}</p>

        <div className="p-4 bg-arch-surface-secondary/50 rounded-xl border border-arch-border-subtle text-sm text-arch-text-secondary space-y-2">
          <p>
            This is the <strong>standalone page view</strong> for `/quickview/${id}`.
          </p>
          <p>
            It renders when the URL is accessed directly or refreshed, ensuring direct shareable
            link support.
          </p>
        </div>
      </div>
    </div>
  )
}
