'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

export default function QuickviewModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  function handleClose() {
    router.back()
  }

  return (
    <div
      className="fixed inset-0 z-modal-overlay bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-arch-surface-primary border border-arch-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-arch-text-muted hover:text-arch-text-primary p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="modal-title" className="text-xl font-semibold text-arch-text-primary mb-2">
          Item Quickview
        </h2>
        <p className="text-sm text-arch-text-muted mb-4 font-mono">ID: {id}</p>

        <div className="bg-arch-surface-secondary/50 rounded-xl p-4 border border-arch-border-subtle text-sm text-arch-text-secondary space-y-2">
          <p>
            This modal is rendered via <strong>Intercepting Routes</strong> ((.)quickview/[id]).
          </p>
          <p>Navigating back closes this overlay without unmounting the parent page context.</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium bg-arch-brand text-white rounded-lg hover:bg-arch-brand/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
