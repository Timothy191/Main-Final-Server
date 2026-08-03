'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

interface AnimeNumberProps {
  value: number
  duration?: number
  round?: number
  prefix?: string
  suffix?: string
  className?: string
  format?: 'number' | 'percentage' | 'time'
}

export function AnimeNumber({
  value,
  duration = 1200,
  round = 0,
  prefix = '',
  suffix = '',
  className,
  format = 'number',
}: AnimeNumberProps) {
  const root = useRef<HTMLSpanElement>(null)
  const scope = useRef<{ revert: () => void } | null>(null)

  useEffect(() => {
    if (!root.current) return

    let cancelled = false

    import('animejs').then(({ animate, createScope }) => {
      if (cancelled || !root.current) return

      scope.current = createScope({ root }).add(() => {
        animate(root.current!, {
          innerHTML: [0, value],
          round,
          duration,
          ease: 'outExpo',
        })
      })
    })

    return () => {
      cancelled = true
      scope.current?.revert()
    }
  }, [value, duration, round])

  const displayPrefix = format === 'percentage' && !prefix ? '' : prefix
  const displaySuffix = format === 'percentage' && !suffix ? '%' : suffix

  return (
    <span ref={root} className={cn('tabular-nums', className)}>
      {displayPrefix}0{displaySuffix}
    </span>
  )
}
