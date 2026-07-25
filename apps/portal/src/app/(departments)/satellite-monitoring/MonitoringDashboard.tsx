'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Satellite,
  Activity,
  Layers3,
  Eye,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import type { SatelliteMetrics } from './actions'
import type { SystemHealthMetrics, AlertMetrics } from './system-health-actions'
import { KpiCardGrid } from '@/features/monitoring/components/KpiCard'
import { StatusIndicator } from '@/features/monitoring/components/StatusIndicator'
import { StatusProgressRing } from '@/features/monitoring/components/ProgressRing'
import { AlertList } from '@/features/monitoring/components/AlertCard'
import { GlassCard } from '@repo/ui/GlassCard'
import { cn } from '@repo/ui/lib/utils'

/* ------------------------------------------------------------------ */
/*  Status color helper                                                */
/* ------------------------------------------------------------------ */

function getHealthStatus(value: number): 'success' | 'warning' | 'error' | 'info' {
  if (value >= 90) return 'error'
  if (value >= 75) return 'warning'
  if (value >= 50) return 'info'
  return 'success'
}

function getSystemStatus(value: number): 'operational' | 'degraded' | 'offline' | 'maintenance' {
  if (value >= 90) return 'operational'
  if (value >= 70) return 'degraded'
  return 'offline'
}

/* ------------------------------------------------------------------ */
/*  Satellite Overview — KPI cards + sensor breakdown                  */
/* ------------------------------------------------------------------ */

function SensorStatusSummary({ metrics }: { metrics: SatelliteMetrics }) {
  const uptime =
    metrics.totalSensors > 0 ? Math.round((metrics.activeSensors / metrics.totalSensors) * 100) : 0

  const kpis = useMemo(
    () => [
      {
        label: 'Total Sensors',
        value: metrics.totalSensors,
        icon: Satellite,
        color: 'blue' as const,
        trend: metrics.totalSensors > 0 ? ('up' as const) : undefined,
      },
      {
        label: 'Active Sensors',
        value: metrics.activeSensors,
        icon: Activity,
        color: 'green' as const,
        trend: metrics.activeSensors > 0 ? ('up' as const) : undefined,
        trendValue: `${uptime}%`,
      },
      {
        label: 'Recent Passes',
        value: metrics.recentLogsCount,
        icon: Layers3,
        color: 'charcoal' as const,
      },
      {
        label: 'Last Pass',
        value: metrics.lastLogDate ?? '—',
        icon: Eye,
        color: 'blue' as const,
      },
    ],
    [metrics, uptime]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-arch11 uppercase tracking-wider">
          Sensor Overview
        </h2>
        <StatusIndicator
          status={uptime >= 90 ? 'operational' : uptime >= 70 ? 'degraded' : 'offline'}
          size="sm"
          showLabel
        />
      </div>
      <KpiCardGrid kpis={kpis} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  System Health — Resource utilization from real metrics             */
/* ------------------------------------------------------------------ */

function SystemHealthPanel({ health }: { health: SystemHealthMetrics }) {
  const status = getSystemStatus(health.uptimePercentage)

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-arch11 uppercase tracking-wider">
            System Health
          </h3>
          <StatusIndicator status={status} size="sm" />
        </div>
        <div className="flex items-center gap-2 text-xs text-arch8">
          <span className="font-medium">{health.activeJobs} jobs</span>
          <span className="text-arch5">|</span>
          <span className="font-medium">{health.jobSuccessRate}% success</span>
          <span className="text-arch5">|</span>
          <CacheCleanupButton />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div className="flex flex-col items-center gap-2">
          <Cpu className="w-5 h-5 text-arch8" />
          <StatusProgressRing
            value={health.cpuUtilization}
            max={100}
            status={getHealthStatus(health.cpuUtilization)}
            size={64}
            strokeWidth={6}
          />
          <span className="text-xs text-arch8 font-medium">CPU</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <MemoryStick className="w-5 h-5 text-arch8" />
          <StatusProgressRing
            value={health.memoryUtilization}
            max={100}
            status={getHealthStatus(health.memoryUtilization)}
            size={64}
            strokeWidth={6}
          />
          <span className="text-xs text-arch8 font-medium">Memory</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <HardDrive className="w-5 h-5 text-arch8" />
          <StatusProgressRing
            value={health.diskUtilization}
            max={100}
            status={getHealthStatus(health.diskUtilization)}
            size={64}
            strokeWidth={6}
          />
          <span className="text-xs text-arch8 font-medium">Disk</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Wifi className="w-5 h-5 text-arch8" />
          <StatusProgressRing
            value={health.networkUtilization}
            max={100}
            status={getHealthStatus(health.networkUtilization)}
            size={64}
            strokeWidth={6}
          />
          <span className="text-xs text-arch8 font-medium">Network</span>
        </div>
      </div>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Active Alerts section                                              */
/* ------------------------------------------------------------------ */

function AlertSummaryPanel({ alerts }: { alerts: AlertMetrics }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-arch11 uppercase tracking-wider">
            Active Alerts
          </h3>
          {alerts.criticalCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-arch12/10 text-arch12 text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {alerts.criticalCount} critical
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              All clear
            </span>
          )}
        </div>
        <span className="text-xs text-arch8">
          {alerts.totalAlerts} total
          {alerts.warningCount > 0 && (
            <span className="ml-1">({alerts.warningCount} warnings)</span>
          )}
        </span>
      </div>

      <AlertList alerts={alerts.recentAlerts} maxItems={5} />
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Cache Cleanup Trigger                                              */
/* ------------------------------------------------------------------ */

function CacheCleanupButton() {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const handleCleanup = useCallback(async () => {
    setRunning(true)
    setDone(false)
    try {
      const res = await fetch('/api/cleanup/trigger', { method: 'POST' })
      if (res.ok) {
        setDone(true)
        setTimeout(() => setDone(false), 3000)
      }
    } catch {
      // Silently fail — non-critical action
    } finally {
      setRunning(false)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={handleCleanup}
      disabled={running}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
        done
          ? 'bg-accent-green/10 text-accent-green'
          : 'bg-black/[0.03] text-arch8 hover:bg-black/[0.06] active:scale-[0.97]',
        running && 'opacity-50 cursor-not-allowed'
      )}
      title={done ? 'Cache cleanup triggered' : 'Trigger cache cleanup'}
    >
      <RefreshCw className={cn('w-3 h-3', running && 'animate-spin')} />
      {done ? 'Cleaned!' : 'Clear Cache'}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Sensor Type Breakdown                                              */
/* ------------------------------------------------------------------ */

function SensorTypeBreakdown({ metrics }: { metrics: SatelliteMetrics }) {
  if (metrics.machineTypes.length === 0) return null

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-arch11 uppercase tracking-wider mb-4">
        Sensor Inventory by Type
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.machineTypes.map(({ type, count, active }) => (
          <div
            key={type}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg transition-colors',
              active > 0 ? 'bg-white/5 hover:bg-white/10' : 'bg-white/[0.02] opacity-60'
            )}
          >
            <div>
              <p className="text-sm font-medium text-arch-text-primary">{type}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <StatusIndicator status={active > 0 ? 'operational' : 'offline'} size="sm" />
                <span className="text-xs text-arch-text-muted">{active} active</span>
              </div>
            </div>
            <span className="text-lg font-bold text-arch-text-primary">{count}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                          */
/* ------------------------------------------------------------------ */

interface MonitoringDashboardProps {
  metrics: SatelliteMetrics
  health: SystemHealthMetrics
  alerts: AlertMetrics
}

export function MonitoringDashboard({ metrics, health, alerts }: MonitoringDashboardProps) {
  return (
    <div className="space-y-6">
      {/* KPI Overview with Status */}
      <SensorStatusSummary metrics={metrics} />

      {/* System Health Rings (wired to real observability data) */}
      <SystemHealthPanel health={health} />

      {/* Active Alerts from shift completeness checks */}
      <AlertSummaryPanel alerts={alerts} />

      {/* Sensor Type Breakdown */}
      <SensorTypeBreakdown metrics={metrics} />
    </div>
  )
}
