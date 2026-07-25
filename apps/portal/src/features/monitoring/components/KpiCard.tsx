/**
 * @module features/monitoring/components/KpiCard
 * KPI Card component for displaying key performance indicators
 */

'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus, AlertTriangle } from 'lucide-react'
import type { KpiCardProps } from '../types'

// Color Configuration
const COLOR_CONFIG = {
  charcoal: {
    bg: 'bg-arch1/80',
    text: 'text-arch11',
    icon: 'text-arch13',
    border: 'border-arch13/20',
  },
  green: {
    bg: 'bg-accent-green/10',
    text: 'text-accent-green',
    icon: 'text-accent-green',
    border: 'border-accent-green/20',
  },
  red: {
    bg: 'bg-arch12/10',
    text: 'text-arch12',
    icon: 'text-arch12',
    border: 'border-arch12/20',
  },
  yellow: {
    bg: 'bg-yellow-400/10',
    text: 'text-yellow-400',
    icon: 'text-yellow-400',
    border: 'border-yellow-400/20',
  },
  blue: {
    bg: 'bg-blue-400/10',
    text: 'text-blue-400',
    icon: 'text-blue-400',
    border: 'border-blue-400/20',
  },
} as const

const TREND_ICONS = {
  up: ArrowUp,
  down: ArrowDown,
  stable: Minus,
  alert: AlertTriangle,
} as const

// Skeleton Component
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-arch5/20 bg-arch1/50 p-6',
        className
      )}
      role="status"
      aria-label="Loading KPI"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-arch2/50 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-arch2/50 animate-pulse" />
          <div className="h-8 w-16 rounded bg-arch2/50 animate-pulse" />
        </div>
      </div>
    </motion.div>
  )
}

// Main KpiCard Component
export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'charcoal',
  className,
}: KpiCardProps) {
  const config = COLOR_CONFIG[color]
  const TrendIcon = trend ? TREND_ICONS[trend] : null

  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(2) + 'M'
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K'
      }
      return value.toLocaleString()
    }
    return value
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-arch5/20 bg-arch1/50 p-6',
        'transition-all duration-200 hover:border-arch5/40',
        className
      )}
      role="region"
      aria-label={`${label}: ${formattedValue}`}
      tabIndex={0}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-arch5/5 to-transparent pointer-events-none" />

      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            config.bg,
            config.border
          )}
        >
          <Icon className={cn('w-6 h-6', config.icon)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-arch8 mb-1">{label}</p>
          <p className="text-2xl font-bold text-arch11 truncate">{formattedValue}</p>
        </div>

        {trend && TrendIcon && (
          <div className="flex-shrink-0 flex flex-col items-end">
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend === 'up' && 'text-accent-green',
                trend === 'down' && 'text-arch12',
                trend === 'stable' && 'text-arch8',
                trend === 'alert' && 'text-yellow-400'
              )}
            >
              <TrendIcon className="w-4 h-4" />
              {trendValue && <span className="font-mono">{trendValue}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 rounded-xl ring-2 ring-arch13/20 opacity-0 focus-within:opacity-100 transition-opacity" />
    </motion.div>
  )
}

// KpiCard Grid Component
interface KpiCardGridProps {
  kpis: KpiCardProps[]
  className?: string
  gridClassName?: string
}

export function KpiCardGrid({ kpis, className, gridClassName }: KpiCardGridProps) {
  return (
    <div className={className} role="list" aria-label="Key Performance Indicators">
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', gridClassName)}>
        {kpis.map((kpi, index) => (
          <KpiCard
            key={`${kpi.label}-${index}`}
            {...kpi}
            role="listitem"
            aria-posinset={index + 1}
            aria-setsize={kpis.length}
          />
        ))}
      </div>
    </div>
  )
}

// Skeleton Grid for Loading States
export function KpiCardSkeletonGrid({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={className} role="status" aria-label="Loading KPIs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export { KpiCard as default }
