'use client'

import React, { useEffect, useMemo, useState, type ComponentPropsWithoutRef } from 'react'
import { AnimatePresence, motion, type MotionProps } from 'framer-motion'
import { useAutoAnimate } from '@formkit/auto-animate/react'

import { cn } from '@repo/ui/lib/utils'

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations: MotionProps = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
  delay?: number
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(() => React.Children.toArray(children), [children])

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout> | null = null

      if (index < childrenArray.length - 1) {
        timeout = setTimeout(() => {
          setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length)
        }, delay)
      }

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout)
        }
      }
    }, [index, delay, childrenArray.length])

    const itemsToShow = useMemo(() => {
      const result = childrenArray.slice(0, index + 1).reverse()
      return result
    }, [index, childrenArray])

    return (
      <div className={cn(`flex flex-col items-center gap-4`, className)} {...props}>
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>{item}</AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'

/**
 * AnimatedFeed — real-time variant that shows all children with entrance animations.
 * New items animate in; existing items stay rendered without re-animating.
 * Ideal for live activity feeds, alert panels, and streaming data.
 */
export interface AnimatedFeedProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
}

export function AnimatedFeed({ children, className, ...props }: AnimatedFeedProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)} {...props}>
      <AnimatePresence initial={false}>
        {React.Children.toArray(children).map((item) => (
          <motion.div
            key={(item as React.ReactElement).key}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            layout
            className="mx-auto w-full"
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * AutoAnimateList — zero-config animated list wrapper using @formkit/auto-animate.
 * Provides smooth mount/unmount/reorder transitions without Framer Motion boilerplate.
 * Ideal for KPI grids, table rows, and simple card lists.
 */
export interface AutoAnimateListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
}

export function AutoAnimateList({ children, className, ...props }: AutoAnimateListProps) {
  const [parent] = useAutoAnimate({ duration: 250, easing: 'ease-out' })

  return (
    <div ref={parent} className={className} {...props}>
      {children}
    </div>
  )
}
