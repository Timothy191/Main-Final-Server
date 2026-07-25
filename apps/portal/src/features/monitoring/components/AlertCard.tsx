/**
 * @module features/monitoring/components/AlertCard
 * Alert card component for displaying system alerts
 */

'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { motion } from 'framer-motion'
import { AlertTriangle, XCircle, Info, CheckCircle2, Clock } from 'lucide-react'
import type { AlertCardProps, Alert } from '../types'

// Alert severity configuration
const ALERT_CONFIG = {
  critical: {
    icon: XCircle,
    color: 'text-arch12',
    bg: 'bg-arch12/10',
    border: 'border-arch12/20',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    label: 'Info',
  },
} as const

export function AlertCard({ alert, onAcknowledge, className }: AlertCardProps) {
  const config = ALERT_CONFIG[alert.severity]
  const Icon = config.icon
  const [isHovered, setIsHovered] = React.useState(false)

  // Format timestamp
  const formattedTime = React.useMemo(() => {
    const date = new Date(alert.timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }, [alert.timestamp])

  // Format date
  const formattedDate = React.useMemo(() => {
    const date = new Date(alert.timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }, [alert.timestamp])

  const handleAcknowledge = () => {
    onAcknowledge?.(alert.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'relative overflow-hidden rounded-xl border border-arch5/20 bg-arch1/50 p-4',
        'transition-all duration-200',
        alert.acknowledged && 'opacity-60',
        className
      )}
      role="region"
      aria-label={`Alert: ${alert.title}`}
      tabIndex={0}
    >
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          config.color.replace('text-', 'bg-')
        )}
      />

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            config.bg,
            config.border
          )}
        >
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full',
                config.bg,
                config.border,
                config.color
              )}
            >
              {config.label}
            </span>
            <span className="text-xs text-arch8">
              {formattedDate} at {formattedTime}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-arch11 mb-1 truncate">{alert.title}</h3>

          <p className="text-sm text-arch8 line-clamp-2">{alert.message}</p>

          <p className="text-xs text-arch8/60 mt-1">Source: {alert.source}</p>
        </div>

        {!alert.acknowledged && onAcknowledge && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={handleAcknowledge}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg text-arch8 hover:text-arch11',
              'hover:bg-arch2/50 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-arch13/20'
            )}
            aria-label="Acknowledge alert"
            title="Acknowledge alert"
          >
            <CheckCircle2 className="w-4 h-4" />
          </motion.button>
        )}

        {alert.acknowledged && (
          <div className="flex-shrink-0 p-1.5">
            <Clock className="w-4 h-4 text-arch8/60" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 rounded-xl ring-2 ring-arch13/20 opacity-0 focus-within:opacity-100 transition-opacity" />
    </motion.div>
  )
}

// Alert card skeleton for loading states
export function AlertCardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-arch5/20 bg-arch1/50 p-4',
        className
      )}
      role="status"
      aria-label="Loading alert"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-arch2/50 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-arch2/50 animate-pulse" />
          <div className="h-3 w-full rounded bg-arch2/50 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-arch2/50 animate-pulse" />
        </div>
      </div>
    </motion.div>
  )
}

// Alert list component
export function AlertList({
  alerts,
  onAcknowledge,
  className,
  maxItems = 5,
}: {
  alerts: Alert[]
  onAcknowledge?: (alertId: string) => void
  className?: string
  maxItems?: number
}) {
  const displayedAlerts = alerts.slice(0, maxItems)

  if (displayedAlerts.length === 0) {
    return (
      <div className={cn('text-center py-8', className)} role="status">
        <p className="text-arch8 text-sm">No active alerts</p>
      </div>
    )
  }

  return (
    <div className={className} role="list">
      <div className="space-y-3">
        {displayedAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onAcknowledge={onAcknowledge} role="listitem" />
        ))}
      </div>

      {alerts.length > maxItems && (
        <p className="text-xs text-arch8/60 text-center mt-4">
          +{alerts.length - maxItems} more alerts
        </p>
      )}
    </div>
  )
}

// Alert list skeleton
export function AlertListSkeleton({
  count = 3,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={className} role="status" aria-label="Loading alerts">
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <AlertCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export { AlertCard as default }
