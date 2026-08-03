'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

interface AnimeStaggerProps {
  children: React.ReactNode
  className?: string
  childClassName?: string
  staggerDelay?: number
  delayChildren?: number
  duration?: number
  ease?: string
  axis?: 'x' | 'y'
  distance?: number
}

export function AnimeStagger({
  children,
  className,
  childClassName,
  staggerDelay = 60,
  delayChildren = 0,
  duration = 600,
  ease = 'outExpo',
  axis = 'y',
  distance = 24,
}: AnimeStaggerProps) {
  const root = useRef<HTMLDivElement>(null)
  const scope = useRef<{ revert: () => void } | null>(null)

  useEffect(() => {
    if (!root.current) return

    let cancelled = false

    import('animejs').then(({ animate, createScope, stagger }) => {
      if (cancelled || !root.current) return

      const targets = root.current.querySelectorAll('[data-anime-child]')
      if (!targets.length) return

      const fromValue = axis === 'y' ? [distance, 0] : [distance, 0]
      const prop = axis === 'y' ? 'y' : 'x'

      scope.current = createScope({ root }).add(() => {
        animate(targets, {
          [prop]: fromValue,
          opacity: [0, 1],
          duration,
          ease,
          delay: stagger(staggerDelay, { start: delayChildren }),
        })
      })
    })

    return () => {
      cancelled = true
      scope.current?.revert()
    }
  }, [staggerDelay, delayChildren, duration, ease, axis, distance])

  return (
    <div ref={root} className={cn(className)}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} data-anime-child className={childClassName}>
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
