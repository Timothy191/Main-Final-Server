'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@repo/ui/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'rendering', label: 'Rendering' },
  { value: 'printing', label: 'Printing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

interface StatusFilterProps {
  current: string
}

export function StatusFilter({ current }: StatusFilterProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams()
      if (value !== 'all') params.set('status', value)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router]
  )

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        'h-9 rounded-lg border border-arch-border-default',
        'bg-white/70 backdrop-blur-xl',
        'px-3 py-1.5 text-sm text-arch-text-primary',
        'focus:outline-none focus:ring-2 focus:ring-arch-accent-charcoal/30',
        'appearance-none cursor-pointer'
      )}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
