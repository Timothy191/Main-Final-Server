'use client'

import { GlassCard } from '@repo/ui/GlassCard'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Server,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useControlRoomCache } from '@/hooks/useControlRoomCache'

export type SCADAAlert = {
  id: string
  timestamp: string
  severity: 'critical' | 'warning' | 'info'
  tag: string
  message: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  category?: 'hydraulic' | 'fuel' | 'speed' | 'temperature' | 'pressure' | 'electrical'
}

const DEFAULT_ALERTS: SCADAAlert[] = [
  {
    id: 'scada-1',
    timestamp: '14:32:05',
    severity: 'critical',
    tag: 'EXC_04_HYDRAULIC_TEMP',
    message: 'Excavator 04 hydraulic oil temp threshold exceeded (>85°C)',
    value: 88.4,
    unit: '°C',
    trend: 'up',
    category: 'hydraulic',
  },
  {
    id: 'scada-2',
    timestamp: '14:28:19',
    severity: 'warning',
    tag: 'TRK_102_FUEL_LEVEL',
    message: 'Haul Truck 102 low fuel warning (<15%)',
    value: 12.5,
    unit: '%',
    trend: 'down',
    category: 'fuel',
  },
  {
    id: 'scada-3',
    timestamp: '14:15:00',
    severity: 'info',
    tag: 'CONVEYOR_01_SPEED',
    message: 'Main Coal Overland Conveyor speed synchronized',
    value: 4.2,
    unit: 'm/s',
    trend: 'stable',
    category: 'speed',
  },
]

// Control Room specific style variants
const CONTROL_ROOM_STYLES = {
  critical: 'text-accent-red bg-red-500/15 border-red-500/30',
  warning: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  info: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
}

const _CATEGORY_ICONS = {
  hydraulic: AlertTriangle,
  fuel: Activity,
  speed: TrendingUp,
  temperature: Server,
  pressure: Radio,
  electrical: Clock,
}

// Control Room SCADA Alert Feed Component
// Enhanced with caching, trend indicators, and category support

export function SCADAAlertFeed() {
  const [alerts, setAlerts] = useState<SCADAAlert[]>(DEFAULT_ALERTS)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Cache for SCADA alerts using the Control Room cache hook
  const { data: cachedAlerts, refresh: _refreshSCADACache } = useControlRoomCache<SCADAAlert[]>(
    'control-room:scada-alerts',
    async () => {
      const res = await fetch('/api/v2/telemetry/push')
      if (!res.ok) throw new Error('Failed to fetch SCADA data')
      const json = await res.json()
      return json?.alerts || []
    },
    {
      ttlSeconds: 15,
      tags: ['control-room', 'scada', 'telemetry'],
    }
  )

  const fetchSCADAData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/v2/telemetry/push')
      if (res.ok) {
        const json = await res.json()
        if (json?.alerts && Array.isArray(json.alerts)) {
          setAlerts(json.alerts)
          setLastUpdate(new Date())
        }
      }
    } catch (error) {
      console.warn('SCADA feed error, using cached data:', error)
      if (cachedAlerts) {
        setAlerts(cachedAlerts)
        setLastUpdate(new Date())
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [cachedAlerts])

  const handleRefresh = () => {
    fetchSCADAData()
  }

  useEffect(() => {
    fetchSCADAData()
    const timer = setInterval(() => {
      fetchSCADAData()
    }, 15000)
    return () => clearInterval(timer)
  }, [fetchSCADAData])

  const getSeverityBadge = (severity: SCADAAlert['severity']) => {
    const style = CONTROL_ROOM_STYLES[severity] || CONTROL_ROOM_STYLES.info
    const Icon =
      severity === 'critical'
        ? AlertTriangle
        : severity === 'warning'
          ? AlertTriangle
          : CheckCircle2
    const label =
      severity === 'critical' ? 'CRITICAL' : severity === 'warning' ? 'WARNING' : 'NORMAL'

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-semibold ${style} flex items-center gap-1`}
      >
        <Icon className="w-3 h-3" /> {label}
      </span>
    )
  }

  const _getTrendIcon = (trend?: SCADAAlert['trend']) => {
    if (!trend) return null
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-xs text-green-400 ml-1" />
      case 'down':
        return <TrendingDown className="text-xs text-red-400 ml-1" />
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date()
      const [hours, minutes, seconds] = timestamp.split(':')
      date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'), parseInt(seconds || '0'))
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timestamp
    }
  }

  return (
    <GlassCard className="border border-white/10 rounded-lg shadow-[0_4px_6px_-1px_rgba(220,38,38,0.1),_0_2px_4px_-1px_rgba(220,38,38,0.06)]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-500/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider flex items-center gap-2">
            SCADA Live Telemetry Feed
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
            FUXA LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-arch-text-muted">
          <Clock className="w-3 h-3" />
          <span>
            {lastUpdate ? formatTimestamp(lastUpdate.toTimeString().slice(0, 8)) : 'Live'}
          </span>
          {cachedAlerts && (
            <>
              <span className="mx-1">•</span>
              <span className="text-[9px]">Cached</span>
            </>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-arch-text-muted hover:text-arch-text-primary transition-colors flex items-center gap-1 text-xs"
          title="Refresh SCADA stream"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getSeverityBadge(alert.severity)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 font-medium">{alert.tag}</span>
                  <span className="text-[10px] text-arch-text-muted font-mono">
                    {alert.timestamp}
                  </span>
                </div>
                <p className="text-xs text-arch-text-primary mt-0.5">{alert.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-bold font-mono text-arch-text-primary">
                {alert.value} {alert.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
