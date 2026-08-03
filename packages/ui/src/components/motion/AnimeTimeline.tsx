'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { cn } from '@repo/ui/lib/utils'

export interface AnimeTimelineHandle {
  play: () => void
  pause: () => void
  restart: () => void
  reverse: () => void
}

interface AnimeTimelineProps {
  children: React.ReactNode
  className?: string
  childClassName?: string
  autoPlay?: boolean
  onComplete?: () => void
}

export const AnimeTimeline = forwardRef<AnimeTimelineHandle, AnimeTimelineProps>(
  ({ children, className, childClassName, autoPlay = true, onComplete }, ref) => {
    const root = useRef<HTMLDivElement>(null)
    const scope = useRef<{ revert: () => void } | null>(null)
    const timelineRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      play: () => timelineRef.current?.play(),
      pause: () => timelineRef.current?.pause(),
      restart: () => timelineRef.current?.restart(),
      reverse: () => timelineRef.current?.reverse(),
    }))

    useEffect(() => {
      if (!root.current) return

      const targets = root.current.querySelectorAll('[data-anime-step]')
      if (!targets.length) return

      // eslint-disable-next-line no-unused-vars
      let cancelled = false

      import('animejs').then(({ createScope, createTimeline }) => {
        scope.current = createScope({ root }).add(() => {
          timelineRef.current = createTimeline({
            autoplay: autoPlay,
            onComplete,
          })

          targets.forEach((target, i) => {
            const el = target as HTMLElement
            const stepDelay = Number(el.dataset.animeDelay || 0)
            const stepDuration = Number(el.dataset.animeDuration || 400)
            const stepEase = el.dataset.animeEase || 'outExpo'
            const stepType = el.dataset.animeType || 'fadeSlide'

            switch (stepType) {
              case 'fadeSlide':
                timelineRef.current?.add(
                  target,
                  {
                    y: [16, 0],
                    opacity: [0, 1],
                    duration: stepDuration,
                    ease: stepEase,
                  },
                  stepDelay || i * 200
                )
                break
              case 'scalePop':
                timelineRef.current?.add(
                  target,
                  {
                    scale: [0.85, 1],
                    opacity: [0, 1],
                    duration: stepDuration,
                    ease: stepEase,
                  },
                  stepDelay || i * 200
                )
                break
              case 'alertPulse':
                timelineRef.current?.add(
                  target,
                  {
                    scale: [1, 1.04, 1],
                    opacity: [0.6, 1],
                    duration: stepDuration,
                    ease: stepEase,
                  },
                  stepDelay || i * 150
                )
                break
              case 'slideRight':
                timelineRef.current?.add(
                  target,
                  {
                    x: [-24, 0],
                    opacity: [0, 1],
                    duration: stepDuration,
                    ease: stepEase,
                  },
                  stepDelay || i * 200
                )
                break
              default:
                timelineRef.current?.add(
                  target,
                  { opacity: [0, 1], duration: stepDuration, ease: stepEase },
                  stepDelay || i * 200
                )
            }
          })
        })
      })

      return () => {
        cancelled = true
        scope.current?.revert()
      }
    }, [autoPlay, onComplete])

    return (
      <div ref={root} className={cn(className)}>
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} data-anime-step data-anime-index={i} className={childClassName}>
                {child}
              </div>
            ))
          : children}
      </div>
    )
  }
)

AnimeTimeline.displayName = 'AnimeTimeline'
