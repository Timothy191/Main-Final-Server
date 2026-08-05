'use client'

import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'

export interface GlassIconItem {
  /** Icon React node */
  icon: React.ReactNode
  /** Visible label */
  label: string
  /** Background style key or arbitrary color. */
  color?: 'blue' | 'purple' | 'red' | 'indigo' | 'orange' | 'green' | string
  /** Extra class for this item. */
  className?: string
  /** Optional click handler */
  onClick?: () => void
}

export interface GlassIconsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: GlassIconItem[]
}

/**
 * 3D-tilted glass icon dock adapted from react-bits GlassIcons.
 * Rewritten to use Arch System accent tokens and Tailwind-only styling.
 *
 * AGENT-TRACE: reverse-engineered from react-bits GlassIcons and refactored
 * to remove em-based sizing in favor of Tailwind spacing and --accent-* tokens.
 */
export function GlassIcons({ items, className, ...props }: GlassIconsProps) {
  const getBackgroundStyle = React.useCallback((color?: string): React.CSSProperties => {
    switch (color) {
      case 'blue':
        return { background: 'linear-gradient(var(--accent-blue), var(--accent-blue))' }
      case 'purple':
        return { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }
      case 'red':
        return { background: 'linear-gradient(var(--accent-red), var(--accent-red))' }
      case 'indigo':
        return { background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }
      case 'orange':
        return { background: 'linear-gradient(135deg, #f59e0b, #d97706)' }
      case 'green':
        return { background: 'linear-gradient(var(--accent-green), var(--accent-green))' }
      default:
        return {
          background: color || 'linear-gradient(var(--accent-charcoal), var(--accent-charcoal))',
        }
    }
  }, [])

  return (
    <div
      className={cn('grid grid-cols-2 gap-16 overflow-visible p-8 md:grid-cols-3', className)}
      {...props}
    >
      {items.map((item, index) => (
        <button
          key={index}
          type="button"
          aria-label={item.label}
          onClick={item.onClick}
          className={cn(
            'group relative h-[4.5rem] w-[4.5rem] cursor-pointer border-0 bg-transparent outline-none',
            'perspective-[24rem] transform-style-3d',
            item.className
          )}
        >
          <span
            className={cn(
              'absolute inset-0 rounded-[1.25rem] transition-all duration-300',
              'group-hover:translate-x-[-0.5rem] group-hover:translate-y-[-0.5rem] group-hover:translate-z-[0.5rem] group-hover:rotate-[25deg]',
              'group-focus-visible:translate-x-[-0.5rem] group-focus-visible:translate-y-[-0.5rem] group-focus-visible:translate-z-[0.5rem] group-focus-visible:rotate-[25deg]'
            )}
            style={{
              ...getBackgroundStyle(item.color),
              boxShadow: '0.5rem -0.5rem 0.75rem rgba(4, 12, 24, 0.15)',
              transform: 'rotate(15deg)',
              transformOrigin: '100% 100%',
            }}
          />
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-[1.25rem]',
              'bg-white/[0.15] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] glass-backdrop',
              'transition-all duration-300',
              'group-hover:translate-z-[2rem] group-focus-visible:translate-z-[2rem]'
            )}
            style={{ transformOrigin: '80% 50%' }}
          >
            <span className="flex h-6 w-6 items-center justify-center" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span
            className={cn(
              'absolute left-0 right-0 top-full whitespace-nowrap text-center text-sm leading-8',
              'opacity-0 transition-all duration-300',
              'group-hover:translate-y-[20%] group-hover:opacity-100',
              'group-focus-visible:translate-y-[20%] group-focus-visible:opacity-100'
            )}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}
