'use client'

import { useState, useCallback } from 'react'
import { Download } from 'lucide-react'

export function ExportButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert('Report downloaded successfully!')
    }, 1200)
  }, [])

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-arch-accent-charcoal hover:underline font-semibold disabled:opacity-50"
    >
      <Download className="w-3 h-3" />
      <span>{loading ? 'Downloading...' : 'Export'}</span>
    </button>
  )
}
