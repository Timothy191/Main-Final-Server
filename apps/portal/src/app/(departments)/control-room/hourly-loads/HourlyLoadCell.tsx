'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus } from 'lucide-react'
import { adjustHourlyLoad, type AdjustHourlyLoadResult } from '../actions'
import { toast } from 'sonner'

interface HourlyLoadCellProps {
  id: string
  hourColumn: string
  value: number
  onAdjusted?: (result: AdjustHourlyLoadResult) => void
}

export function HourlyLoadCell({ id, hourColumn, value, onAdjusted }: HourlyLoadCellProps) {
  const [count, setCount] = useState(value)
  const [isPending, startTransition] = useTransition()

  const handleAdjust = (delta: 1 | -1) => {
    if (count + delta < 0) return

    // Optimistic update
    setCount((prev) => prev + delta)

    startTransition(async () => {
      try {
        const result = await adjustHourlyLoad({ id, hourColumn, delta })
        setCount(result.newValue)
        onAdjusted?.(result)
      } catch (err) {
        // Roll back on error
        setCount((prev) => prev - delta)
        toast.error(err instanceof Error ? err.message : 'Failed to update load')
      }
    })
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label={`Decrease ${hourColumn}`}
        title={`Decrease ${hourColumn}`}
        disabled={isPending || count <= 0}
        onClick={() => handleAdjust(-1)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-arch-border text-arch-text-secondary hover:bg-arch-surface-tertiary hover:text-arch-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arch-accent-charcoal disabled:opacity-40"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span
        className="min-w-[1.5rem] text-center tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {count}
      </span>
      <button
        type="button"
        aria-label={`Increase ${hourColumn}`}
        title={`Increase ${hourColumn}`}
        disabled={isPending}
        onClick={() => handleAdjust(1)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-arch-border text-arch-text-secondary hover:bg-arch-surface-tertiary hover:text-arch-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arch-accent-charcoal disabled:opacity-40"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
