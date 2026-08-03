'use client'

/**
 * ThemeToggle — Light mode indicator (non-interactive).
 * Inline SVG avoids a lucide-react dependency in @repo/theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={`glass-button h-9 w-9 rounded-full flex items-center justify-center ${className ?? ''}`}
      aria-label="Light mode"
    >
      <svg
        className="h-4 w-4 text-[var(--text-secondary)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    </button>
  )
}
