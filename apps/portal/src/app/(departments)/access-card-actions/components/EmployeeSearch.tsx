'use client'

import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/components/ui/input'
import { searchEmployees } from '../actions'
import { Search, Loader2 } from 'lucide-react'

type Employee = Awaited<ReturnType<typeof searchEmployees>>['employees'][0]

interface EmployeeSearchProps {
  onSelect: (_employee: Employee | null) => void
}

export function EmployeeSearch({ onSelect }: EmployeeSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Employee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      if (query.length === 0) onSelect(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { employees } = await searchEmployees(query)
        setResults(employees)
        setIsOpen(true)
      } catch {
        // Suppress errors during search
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSelect])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-arch-text-muted" />
        <Input
          aria-label="Search by name or ID"
          placeholder="Search by name or ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 bg-arch-surface-primary border-arch-border-default"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-arch-text-muted" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-arch-surface-primary border border-arch-border-default rounded-md shadow-diffusion-md z-50 max-h-60 overflow-y-auto">
          {results.map((emp) => (
            <button
              key={emp.id}
              onClick={() => {
                setQuery(`${emp.first_name} ${emp.last_name}`)
                setIsOpen(false)
                onSelect(emp)
              }}
              className="w-full text-left px-4 py-2 hover:bg-arch-surface-secondary focus:bg-arch-surface-secondary border-b border-arch-border-default last:border-0"
            >
              <div className="font-medium text-arch-text-primary">
                {emp.first_name} {emp.last_name}
              </div>
              <div className="text-xs text-arch-text-muted">
                ID: {emp.national_id} | {emp.job_title}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
