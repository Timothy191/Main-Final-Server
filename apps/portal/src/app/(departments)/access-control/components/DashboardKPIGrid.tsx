import React from 'react'
import {
  QrCode,
  Clock,
  ShieldAlert,
  ScanLine,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import type { AccessControlMetrics } from '../actions'

interface KPICardProps {
  id: string
  title: string
  value: string | number
  subtext: string
  icon: React.ElementType
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string }
  variant?: 'default' | 'warning' | 'danger' | 'success'
  hero?: boolean
}

const variantStyles = {
  default: {
    card: 'bg-card border-border',
    icon: 'bg-primary/10 text-primary',
    value: 'text-foreground',
  },
  warning: {
    card: 'bg-warning/5 border-warning/30',
    icon: 'bg-warning/10 text-warning',
    value: 'text-warning',
  },
  danger: {
    card: 'bg-danger/5 border-danger/30',
    icon: 'bg-danger/10 text-danger',
    value: 'text-danger',
  },
  success: {
    card: 'bg-success/5 border-success/30',
    icon: 'bg-success/10 text-success',
    value: 'text-success',
  },
}

function KPICard({
  id,
  title,
  value,
  subtext,
  icon: IconComp,
  trend,
  variant = 'default',
  hero = false,
}: KPICardProps) {
  const styles = variantStyles[variant]
  const TrendIcon =
    trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus
  const trendColor =
    trend?.direction === 'up'
      ? 'text-success'
      : trend?.direction === 'down'
        ? 'text-danger'
        : 'text-muted-foreground'

  return (
    <div
      key={id}
      className={`rounded-xl border shadow-card hover:shadow-card-hover transition-all duration-200 p-5 flex flex-col justify-between
        ${styles.card} ${hero ? 'min-h-[140px]' : 'min-h-[120px]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {title}
          </p>
          <p className={`tabular-nums font-bold ${hero ? 'text-4xl' : 'text-3xl'} ${styles.value}`}>
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${styles.icon}`}
        >
          <IconComp size={20} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">{subtext}</p>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            {trend.label}
          </span>
        )}
      </div>
    </div>
  )
}

interface DashboardKPIGridProps {
  metrics: AccessControlMetrics
}

export default function DashboardKPIGrid({ metrics }: DashboardKPIGridProps) {
  const kpiData: KPICardProps[] = [
    {
      id: 'kpi-active-qr',
      title: 'Active QR Codes',
      value: metrics.activeQrCodes.toLocaleString(),
      subtext: 'Across employees, vehicles & equipment',
      icon: QrCode,
      trend: { direction: 'up', label: '+23 this week' },
      variant: 'success',
      hero: true,
    },
    {
      id: 'kpi-expiring-soon',
      title: 'Expiring Within 7 Days',
      value: metrics.expiringSoon.toLocaleString(),
      subtext: 'Require renewal before expiry',
      icon: Clock,
      trend: { direction: 'up', label: '+12 since yesterday' },
      variant: 'warning',
    },
    {
      id: 'kpi-denied-today',
      title: 'Denied Attempts Today',
      value: metrics.deniedToday.toLocaleString(),
      subtext: 'Across all zones — review required',
      icon: ShieldAlert,
      trend: { direction: 'up', label: '+4 vs. yesterday' },
      variant: 'danger',
    },
    {
      id: 'kpi-access-today',
      title: 'Access Events Today',
      value: metrics.accessEventsToday.toLocaleString(),
      subtext: 'Total scans across all entry points',
      icon: ScanLine,
      trend: { direction: 'neutral', label: 'Normal range' },
      variant: 'default',
    },
    {
      id: 'kpi-expired-assigned',
      title: 'Expired Still Assigned',
      value: metrics.expiredAssigned.toLocaleString(),
      subtext: 'Critical — revoke immediately',
      icon: AlertCircle,
      trend: { direction: 'down', label: 'Down from 7' },
      variant: 'danger',
    },
    {
      id: 'kpi-entity-coverage',
      title: 'Entity QR Coverage',
      value: `${metrics.entityCoverage}%`,
      subtext: 'Of all registered entities have active QR',
      icon: CheckCircle2,
      trend: { direction: 'up', label: '+1.3% this month' },
      variant: 'success',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="sm:col-span-2 lg:col-span-2">
        <KPICard {...kpiData[0]!} />
      </div>
      <div className="col-span-1">
        <KPICard {...kpiData[1]!} />
      </div>
      <div className="col-span-1">
        <KPICard {...kpiData[2]!} />
      </div>
      <div className="col-span-1">
        <KPICard {...kpiData[3]!} />
      </div>
      <div className="col-span-1">
        <KPICard {...kpiData[4]!} />
      </div>
      <div className="sm:col-span-2 lg:col-span-2">
        <KPICard {...kpiData[5]!} />
      </div>
    </div>
  )
}
