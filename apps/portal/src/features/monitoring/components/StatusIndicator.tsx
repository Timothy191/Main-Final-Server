/**
 * @module features/monitoring/components/StatusIndicator
 * Status indicator component for system health visualization
 */

'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react'
import type { StatusIndicatorProps } from '../types'

// Status configuration
const STATUS_CONFIG = {
  operational: {
    icon: CheckCircle2,
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/20',
    label: 'Operational',
    ariaLabel: 'Operational status',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    label: 'Degraded',
    ariaLabel: 'Degraded status',
  },
  offline: {
    icon: XCircle,
    color: 'text-arch12',
    bg: 'bg-arch12/10',
    border: 'border-arch12/20',
    label: 'Offline',
    ariaLabel: 'Offline status',
  },
  maintenance: {
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    label: 'Maintenance',
    ariaLabel: 'Maintenance status',
  },
} as const

const SIZE_CONFIG = {
  sm: {
    icon: 'w-3 h-3',
    dot: 'w-2 h-2',
    text: 'text-xs',
    padding: 'px-2 py-0.5',
  },
  md: {
    icon: 'w-4 h-4',
    dot: 'w-2.5 h-2.5',
    text: 'text-sm',
    padding: 'px-2.5 py-1',
  },
  lg: {
    icon: 'w-5 h-5',
    dot: 'w-3 h-3',
    text: 'text-sm',
    padding: 'px-3 py-1.5',
  },
} as const

export function StatusIndicator({ status, size = 'md', showLabel = false }: StatusIndicatorProps) {
  const statusConfig = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = statusConfig.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        statusConfig.bg,
        statusConfig.border,
        statusConfig.color,
        sizeConfig.padding
      )}
      role="status"
      aria-label={statusConfig.ariaLabel}
    >
      <Icon className={sizeConfig.icon} />
      {showLabel && <span className={sizeConfig.text}>{statusConfig.label}</span>}
    </span>
  )
}

// Dot-only indicator (more compact)
export function StatusDot({ status, size = 'md' }: Omit<StatusIndicatorProps, 'showLabel'>) {
  const statusConfig = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        statusConfig.bg,
        statusConfig.border
      )}
      role="status"
      aria-label={statusConfig.ariaLabel}
    >
      <span className={cn('rounded-full', statusConfig.color, sizeConfig.dot, 'animate-pulse')} />
    </span>
  )
}

// Status badge with label
export function StatusBadge({
  status,
  label,
  size = 'md',
  className,
}: StatusIndicatorProps & { label?: string; className?: string }) {
  const statusConfig = STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = statusConfig.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        statusConfig.bg,
        statusConfig.border,
        statusConfig.color,
        sizeConfig.padding,
        className
      )}
      role="status"
      aria-label={`${label || statusConfig.label} status: ${status}`}
    >
      <Icon className={sizeConfig.icon} />
      <span className={sizeConfig.text}>{label || statusConfig.label}</span>
    </span>
  )
}

// Status pill for table cells
export function StatusPill({
  status,
  className,
}: Omit<StatusIndicatorProps, 'size' | 'showLabel'> & { className?: string }) {
  const statusConfig = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        statusConfig.bg,
        statusConfig.border,
        statusConfig.color,
        className
      )}
      role="status"
      aria-label={statusConfig.ariaLabel}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      {statusConfig.label}
    </span>
  )
}

export { StatusIndicator as default }
