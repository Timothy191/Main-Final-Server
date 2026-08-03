'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'

export const ARCH_LOCK_EVENT = 'arch-lock-screen'

/**
 * Full-viewport lock overlay. Mount once in the root layout; open via
 * `window.dispatchEvent(new CustomEvent(ARCH_LOCK_EVENT))`.
 */
export function ArchLockOverlay() {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const onLock = () => setLocked(true)
    window.addEventListener(ARCH_LOCK_EVENT, onLock)
    return () => window.removeEventListener(ARCH_LOCK_EVENT, onLock)
  }, [])

  useEffect(() => {
    if (!locked) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setLocked(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [locked])

  if (!locked) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Screen locked"
      data-testid="arch-lock-overlay"
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={() => setLocked(false)}
      tabIndex={0}
    >
      <Lock className="mb-3 h-8 w-8 text-white/80" aria-hidden />
      <p className="text-sm font-medium text-white">Arch locked</p>
      <p className="mt-1 text-xs text-white/60">Click anywhere to unlock</p>
    </div>
  )
}
