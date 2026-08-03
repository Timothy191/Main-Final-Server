'use client'

import Link from 'next/link'
import { Filter } from 'lucide-react'

interface FilterTabsProps {
  paramName: string
  options: string[]
  currentValue?: string
  hiddenParams?: Record<string, string>
}

export function FilterTabs({
  paramName,
  options,
  currentValue = 'All',
  hiddenParams = {},
}: FilterTabsProps) {
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
      <Filter className="w-4 h-4 text-arch-text-muted shrink-0" />
      {options.map((option) => {
        const params = new URLSearchParams()
        Object.entries(hiddenParams).forEach(([k, v]) => {
          params.set(k, v)
        })
        if (option === 'All') {
          params.delete(paramName)
        } else {
          params.set(paramName, option)
        }
        const href = `?${params.toString()}`
        const isActive = currentValue === option

        return (
          <Link
            key={option}
            href={href}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all shrink-0 ${
              isActive
                ? 'bg-[var(--text-heading)] text-white border-transparent'
                : 'bg-arch-surface-chrome hover:bg-arch-surface-chrome-medium text-arch-text-secondary border-arch-border-default'
            }`}
          >
            {option}
          </Link>
        )
      })}
    </div>
  )
}
