'use client'

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-2 bg-arch-surface-tertiary hover:bg-arch-surface-tertiary text-arch-text-primary rounded-lg font-medium transition-colors border border-arch-border-subtle"
    >
      Try Again
    </button>
  )
}
