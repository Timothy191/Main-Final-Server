'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Announces page title changes to screen readers after SPA route transitions.
 *
 * WCAG 4.1.3 (Status Messages): When the route changes client-side, the
 * document title is pushed into an `aria-live` region so assistive tech
 * announces it without requiring a full page reload.
 */
export function RouteAnnouncer() {
  const pathname = usePathname()
  const pathRef = useRef(pathname)
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pathRef.current === pathname) return
    pathRef.current = pathname

    // Give the DOM a tick to render the new page content, then announce
    const id = requestAnimationFrame(() => {
      if (announcerRef.current) {
        const title = document.title || pathname
        announcerRef.current.textContent = `Navigated to ${title}`
      }
    })
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
}
