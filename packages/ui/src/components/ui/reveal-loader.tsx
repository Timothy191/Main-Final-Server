'use client'

import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'

interface RevealLoaderProps {
  className?: string
  rows?: number
  columns?: number
  gap?: number
}

export function RevealLoader({ className, rows = 3, columns = 1, gap = 12 }: RevealLoaderProps) {
  return (
    <div
      className={cn('w-full', className)}
      style={{
        display: 'grid',
        gap,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'relative overflow-hidden rounded-xl',
            'bg-[var(--bg-tertiary)]/50 border border-[var(--border-default)]/30',
            'h-24'
          )}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
            }}
          />

          {/* Content placeholder lines */}
          <div className="p-4 space-y-3">
            <div className="h-4 w-1/3 rounded bg-[var(--bg-tertiary)]">
              <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                }}
              />
            </div>
            <div className="h-3 w-2/3 rounded bg-[var(--bg-tertiary)]">
              <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
