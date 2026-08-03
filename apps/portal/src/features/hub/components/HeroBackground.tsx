'use client'

import { useEffect, useState } from 'react'

export function HeroBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden isolate"
      aria-hidden="true"
    >
      {/* Soft light wash — no dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-arch-surface-secondary/25 via-transparent to-arch-surface-tertiary/15" />
      <div className="absolute inset-0 route-bg-grain opacity-15 mix-blend-soft-light" />

      {prefersReducedMotion ? (
        <div className="absolute inset-0 bg-arch-surface-secondary/15" />
      ) : (
        <>
          <div
            className="absolute -top-16 -left-16 sm:-top-20 sm:-left-20 w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[28rem] lg:h-[28rem] xl:w-[32rem] xl:h-[32rem] rounded-full bg-arch-surface-secondary/80 blur-3xl will-change-transform animate-blob-in"
            style={{ transform: 'translateZ(0)' }}
          />
          <div
            className="absolute -bottom-16 -right-16 sm:-bottom-20 sm:-right-20 w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-[26rem] lg:h-[26rem] xl:w-[28rem] xl:h-[28rem] rounded-full bg-arch-surface-tertiary/70 blur-3xl will-change-transform animate-blob-in"
            style={{ transform: 'translateZ(0)' }}
          />
        </>
      )}
    </div>
  )
}
