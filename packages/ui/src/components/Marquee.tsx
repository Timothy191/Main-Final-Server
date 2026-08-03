import * as React from 'react'
import { cn } from '../lib/utils'

interface MarqueeProps {
  children: React.ReactNode
  className?: string
  pauseOnHover?: boolean
  reverse?: boolean
  /** Number of duplicated tracks for seamless loop; minimum 2. */
  repeat?: number
}

/**
 * Infinite horizontal marquee using theme `animate-marquee` keyframes.
 * Set `--duration` and `--gap` via className (e.g. `[--duration:30s] [--gap:2rem]`).
 */
export function Marquee({
  children,
  className,
  pauseOnHover = false,
  reverse = false,
  repeat = 2,
}: MarqueeProps) {
  const tracks = Math.max(2, repeat)

  return (
    <div
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1.5rem] [gap:var(--gap)]',
        'motion-reduce:justify-center',
        className
      )}
    >
      {Array.from({ length: tracks }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 ? true : undefined}
          className={cn(
            'flex shrink-0 justify-around [gap:var(--gap)]',
            'animate-marquee min-w-full',
            reverse && '[animation-direction:reverse]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
            'motion-reduce:animate-none motion-reduce:min-w-0',
            i > 0 && 'motion-reduce:hidden'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
