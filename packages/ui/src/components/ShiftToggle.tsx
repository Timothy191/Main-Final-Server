'use client'

interface ShiftToggleProps {
  value: 'day' | 'night'
  // eslint-disable-next-line no-unused-vars
  onChange: (value: 'day' | 'night') => void
  name?: string
}

export function ShiftToggle({ value, onChange }: ShiftToggleProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Shift selector">
      {(['day', 'night'] as const).map((shift) => (
        <button
          key={shift}
          type="button"
          role="radio"
          aria-checked={value === shift ? 'true' : 'false'}
          onClick={() => onChange(shift)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            value === shift
              ? 'bg-[var(--accent-blue)] text-[var(--bg-secondary)]'
              : 'bg-[var(--card)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
          }`}
        >
          {shift === 'day' ? 'Day' : 'Night'}
        </button>
      ))}
    </div>
  )
}

export function getCurrentShift(): 'day' | 'night' {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}
