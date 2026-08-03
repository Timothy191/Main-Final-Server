'use client'

import { cn } from '../lib/utils'

interface MacTitleBarProps {
  title?: string
  className?: string
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  rightSlot?: React.ReactNode
}

export function MacTitleBar({
  title,
  className,
  onClose,
  onMinimize,
  onMaximize,
  rightSlot,
}: MacTitleBarProps) {
  return (
    <div
      className={cn(
        'group/titlebar flex items-center gap-3 px-4 h-11',
        'bg-white/50 backdrop-blur-sm border-b border-black/[0.06]',
        'select-none shrink-0',
        className
      )}
    >
      {/* Traffic lights */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="relative w-3 h-3 rounded-full bg-[var(--mac-red)] border border-black/[0.06] opacity-70 group-hover/titlebar:opacity-100 transition-opacity focus:outline-none"
          aria-label="Close window"
        >
          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-red-900/70 font-medium leading-none opacity-0 group-hover/titlebar:opacity-100 transition-opacity">
            ×
          </span>
        </button>
        <button
          type="button"
          onClick={onMinimize}
          className="relative w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-black/[0.06] opacity-70 group-hover/titlebar:opacity-100 transition-opacity focus:outline-none"
          aria-label="Minimize window"
        >
          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-yellow-900/70 font-medium leading-none opacity-0 group-hover/titlebar:opacity-100 transition-opacity">
            −
          </span>
        </button>
        <button
          type="button"
          onClick={onMaximize}
          className="relative w-3 h-3 rounded-full bg-[var(--mac-green)] border border-black/[0.06] opacity-70 group-hover/titlebar:opacity-100 transition-opacity focus:outline-none"
          aria-label="Maximize window"
        >
          <span className="absolute inset-0 flex items-center justify-center text-[7px] text-green-900/70 font-medium leading-none opacity-0 group-hover/titlebar:opacity-100 transition-opacity">
            +
          </span>
        </button>
      </div>

      {/* Centered title */}
      {title && (
        <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] truncate">
          {title}
        </span>
      )}

      {/* Right slot (e.g. toolbar buttons) */}
      {rightSlot && <div className="flex items-center gap-1.5 shrink-0">{rightSlot}</div>}

      {/* Empty spacer to balance title centering when no rightSlot */}
      {title && !rightSlot && <div className="w-[54px] shrink-0" />}
    </div>
  )
}
