'use client'

import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

export interface OverflowListProps<T = unknown> {
  /** Items to render */
  items: T[]
  /** Render function for visible items */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Render function for the overflow trigger (e.g. "+3 more") */
  renderOverflowTrigger?: (count: number) => React.ReactNode
  /** Render function for an item inside the overflow menu */
  renderOverflowItem?: (item: T, index: number, close: () => void) => React.ReactNode
  /** Optional minimum visible count */
  minVisible?: number
  /** Gap between items in pixels (used for width estimation) */
  gap?: number
  className?: string
  /** Forwarded ref */
  ref?: React.Ref<HTMLDivElement>
}

/**
 * Collapse a list of items into an overflow menu when they no longer fit the
 * available width. Ported from Palantir Blueprint's OverflowList and rewritten
 * for Arch System using only React + our dropdown primitive.
 *
 * AGENT-TRACE: reverse-engineered from blueprint OverflowList; no width
 * measurement libraries or ResizeObserver polyfills required.
 */
export function OverflowList<T = unknown>({
  ref,
  items,
  renderItem,
  renderOverflowTrigger,
  renderOverflowItem,
  minVisible = 1,
  gap = 8,
  className,
}: OverflowListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = React.useState(items.length)
  const [open, setOpen] = React.useState(false)

  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    let raf = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const maxWidth = container.clientWidth
        const childWidths = Array.from(container.children).map((child) => {
          const rect = (child as HTMLElement).getBoundingClientRect()
          return rect.width
        })

        let accumulated = 0
        let count = 0
        // Reserve 64px for the overflow trigger if we suspect overflow.
        const triggerReserve = items.length > minVisible ? 64 : 0

        for (let i = 0; i < childWidths.length; i++) {
          const next = accumulated + childWidths[i] + (count > 0 ? gap : 0)
          if (next <= maxWidth - triggerReserve) {
            accumulated = next
            count++
          } else {
            break
          }
        }

        // Ensure at least minVisible items when there is any overflow trigger.
        const clamped = Math.max(Math.min(count, items.length), minVisible)
        setVisibleCount(clamped)
      })
    })

    observer.observe(container)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [items.length, minVisible, gap])

  const visibleItems = items.slice(0, visibleCount)
  const overflowItems = items.slice(visibleCount)
  const hasOverflow = overflowItems.length > 0

  return (
    <div ref={containerRef} className={cn('flex items-center', className)} style={{ gap }}>
      {visibleItems.map((item, index) => (
        <div key={index} className="shrink-0">
          {renderItem(item, index)}
        </div>
      ))}

      {hasOverflow && (
        <div className="shrink-0">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              {renderOverflowTrigger?.(overflowItems.length) ?? (
                <button
                  type="button"
                  className={cn(
                    'glass-chip cursor-pointer',
                    'hover:bg-[var(--arch-glass-surface-hover)]'
                  )}
                >
                  +{overflowItems.length} more
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              {overflowItems.map((item, index) => (
                <DropdownMenuItem key={visibleCount + index}>
                  {renderOverflowItem?.(item, visibleCount + index, () => setOpen(false)) ??
                    renderItem(item, visibleCount + index)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
