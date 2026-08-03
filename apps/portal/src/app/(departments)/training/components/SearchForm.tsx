'use client'

import { Search } from 'lucide-react'

interface SearchFormProps {
  value?: string
  placeholder?: string
  hiddenParams?: Record<string, string>
}

export function SearchForm({
  value = '',
  placeholder = 'Search...',
  hiddenParams = {},
}: SearchFormProps) {
  return (
    <form method="GET" className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-arch-text-muted" />
      <input
        type="text"
        name="q"
        aria-label={placeholder}
        placeholder={placeholder}
        defaultValue={value}
        className="pl-9 w-full h-9 bg-arch-surface-chrome border border-arch-border-default rounded-lg text-sm text-arch-text-primary focus:outline-none focus:border-arch-accent-charcoal"
      />
      {Object.entries(hiddenParams).map(([key, val]) => (
        <input key={key} type="hidden" name={key} value={val} />
      ))}
    </form>
  )
}
