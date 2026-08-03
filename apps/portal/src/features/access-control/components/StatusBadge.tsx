import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@repo/utils'

export type AccessStatus = 'Granted' | 'Denied' | 'Expired Credential' | 'Tailgate Alert'

interface StatusBadgeProps {
  status: AccessStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<
  AccessStatus,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  Granted: {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  Denied: {
    icon: XCircle,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
  },
  'Expired Credential': {
    icon: Clock,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
  },
  'Tailgate Alert': {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-2.5 py-1.5 gap-2',
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        config.color,
        config.bgColor,
        sizeClasses[size]
      )}
    >
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      <span>{status}</span>
    </div>
  )
}
