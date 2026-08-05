'use client'

import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Radial-gradient spotlight color. Default matches the legacy GlassCard spotlight. */
  spotlightColor?: string
  /** Forwarded ref. */
  ref?: React.Ref<HTMLDivElement>
}

/**
 * Lightweight, dependency-free spotlight card.
 * Adapted from react-bits (DavidHDev) and aligned with Arch System's canonical
 * glass tokens. The mouse-tracked glow is rendered as a CSS radial-gradient on
 * CSS custom properties, so no motion library is required.
 *
 * AGENT-TRACE: reverse-engineered from react-bits SpotlightCard and refactored
 * to use --arch-glass-* tokens and Tailwind-only styling.
 */
export function SpotlightCard({
  ref,
  children,
  className,
  spotlightColor = 'rgba(62, 207, 142, 0.12)',
  ...props
}: SpotlightCardProps) {
  const divRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => divRef.current as HTMLDivElement)

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const node = divRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      node.style.setProperty('--spotlight-x', `${x}px`)
      node.style.setProperty('--spotlight-y', `${y}px`)
      node.style.setProperty('--spotlight-color', spotlightColor)
    },
    [spotlightColor]
  )

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'group relative isolate overflow-hidden rounded-card',
        'glass-card glass-depth-card',
        'transition-all duration-300 ease-glass',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 before:content-[""] group-hover:before:opacity-100',
        className
      )}
      style={
        {
          '--spotlight-color': spotlightColor,
          '--spotlight-x': '50%',
          '--spotlight-y': '50%',
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Mouse-tracking spotlight overlay */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(400px circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 80%)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
