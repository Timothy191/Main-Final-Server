import React from 'react'

interface GlassSkeletonProps {
  showHeader?: boolean
  rows?: number
  className?: string
}

export function GlassSkeleton({ showHeader = true, rows = 3, className = '' }: GlassSkeletonProps) {
  return (
    <div
      className={`space-y-4 animate-pulse bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 ${className}`}
    >
      {showHeader && (
        <div className="flex items-center space-x-4 mb-6">
          <div className="h-12 w-12 bg-white/10 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-white/20 rounded w-1/3" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded w-full" />
        ))}
      </div>
    </div>
  )
}
