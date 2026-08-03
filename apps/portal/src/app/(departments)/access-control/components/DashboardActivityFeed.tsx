import React from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { AccessStatus } from '@/features/access-control/components/StatusBadge'
import StatusBadge from '@/features/access-control/components/StatusBadge'
import { AutoAnimateList } from '@repo/ui/AnimatedList'

interface ActivityEntry {
  id: string
  entityName: string
  entityType: string
  zone: string
  status: string
  time: string
  qrId: string
}

const statusIcons: Record<string, React.ElementType> = {
  Granted: CheckCircle2,
  Denied: XCircle,
  'Expired Credential': Clock,
  'Tailgate Alert': AlertTriangle,
}

const entityTypePill: Record<string, string> = {
  Employee: 'bg-primary/10 text-primary',
  Vehicle: 'bg-accent/10 text-accent',
  Equipment: 'bg-secondary text-secondary-foreground',
}

interface DashboardActivityFeedProps {
  activity: ActivityEntry[]
}

export default function DashboardActivityFeed({ activity }: DashboardActivityFeedProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground">Recent Access Events</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {activity.length} scan events across all zones
          </p>
        </div>
        <Link
          href="/access-control/access-logs"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <AutoAnimateList className="divide-y divide-border">
        {activity.map((entry) => {
          const StatusIcon = statusIcons[entry.status] ?? CheckCircle2
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors duration-100 group"
            >
              <div className="shrink-0">
                <StatusIcon
                  size={16}
                  className={
                    entry.status === 'Granted'
                      ? 'text-success'
                      : entry.status === 'Denied' || entry.status === 'Expired Credential'
                        ? 'text-danger'
                        : 'text-warning'
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {entry.entityName}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${entityTypePill[entry.entityType]}`}
                  >
                    {entry.entityType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{entry.zone}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.qrId}</span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <StatusBadge status={entry.status as AccessStatus} size="sm" />
                <span className="text-[10px] font-mono text-muted-foreground">{entry.time}</span>
              </div>
            </div>
          )
        })}
      </AutoAnimateList>
    </div>
  )
}
