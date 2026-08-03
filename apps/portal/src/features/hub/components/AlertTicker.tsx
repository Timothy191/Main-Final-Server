import Link from 'next/link'
import { AlertTriangle, Wrench, Clock } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { AutoAnimateList } from '@repo/ui/AnimatedList'

export interface AlertEvent {
  id: string
  type: 'incident' | 'breakdown' | 'offline'
  title: string
  description?: string
  timestamp: string
  severity: 'critical' | 'warning' | 'info'
  href: string
}

interface AlertTickerProps {
  events: AlertEvent[]
}

function timeAgo(dateString: string): string {
  // Supabase timestamps are UTC but may lack a Z suffix — force UTC parsing
  const hasTz = /[Zz]|[+-]\d{2}:?\d{2}$/.test(dateString)
  const utcString = hasTz ? dateString : dateString + 'Z'
  const date = new Date(utcString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < 0) return 'just now'

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const severityConfig = {
  critical: {
    iconBg: 'bg-accent-red/10 text-accent-red',
    border: 'border-accent-red/20',
    dot: 'bg-accent-red',
    label: 'CRITICAL',
  },
  warning: {
    iconBg: 'bg-accent-amber/10 text-accent-amber',
    border: 'border-accent-amber/20',
    dot: 'bg-accent-amber',
    label: 'WARN',
  },
  info: {
    iconBg: 'bg-accent-blue/10 text-accent-blue',
    border: 'border-accent-blue/20',
    dot: 'bg-accent-blue',
    label: 'INFO',
  },
}

export function AlertTicker({ events }: AlertTickerProps) {
  if (events.length === 0) {
    return (
      <div className="login-oauth flex items-center gap-2 px-3 py-1.5 w-fit">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
        <p className="text-xs text-accent-green font-medium">All systems operational</p>
      </div>
    )
  }

  return (
    <div className="os-shell w-full rounded-[var(--os-shell-radius-lg)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-arch-border-subtle">
        <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />
        <span className="text-xs font-medium login-text-emphasis uppercase tracking-wider">
          Live Alerts
        </span>
        <span className="ml-auto text-[10px] font-mono login-muted-text">
          {events.length} active
        </span>
      </div>

      <AutoAnimateList className="max-h-[200px] overflow-y-auto">
        {events.map((event) => {
          const config = severityConfig[event.severity]
          const Icon = event.type === 'breakdown' ? Wrench : AlertTriangle

          return (
            <Link
              key={event.id}
              href={event.href}
              className={cn(
                'flex items-start gap-3 px-4 py-3 border-b border-arch-border-subtle last:border-b-0',
                'hover:bg-arch-surface-secondary/50 transition-colors duration-150'
              )}
            >
              <div className={cn('mt-0.5 p-1.5 rounded-lg shrink-0', config.iconBg)}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-arch-text-primary truncate">
                    {event.title}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wider',
                      config.iconBg
                    )}
                  >
                    {config.label}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-arch-text-tertiary line-clamp-1 mb-1">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-arch-text-tertiary font-mono">
                  <Clock className="w-3 h-3" />
                  {timeAgo(event.timestamp)}
                </div>
              </div>
            </Link>
          )
        })}
      </AutoAnimateList>
    </div>
  )
}
