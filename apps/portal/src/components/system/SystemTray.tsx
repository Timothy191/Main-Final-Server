'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@repo/ui/lib/utils'
import {
  Wifi,
  WifiOff,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  BatteryCharging,
  Volume2,
  Volume1,
  VolumeX,
  Bell,
  BellDot,
  SignalHigh,
  SignalMedium,
  SignalLow,
  CheckSquare,
  Database,
  HardDrive,
  Zap,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Clock,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
//  Types for APIs not in all TS lib definitions
/* ------------------------------------------------------------------ */
interface BatteryManager extends EventTarget {
  charging: boolean
  level: number
  chargingTime: number
  dischargingTime: number
  addEventListener(
    _type: 'chargingchange' | 'levelchange' | 'chargingtimechange' | 'dischargingtimechange',
    _listener: EventListenerOrEventListenerObject
  ): void
  removeEventListener(
    _type: 'chargingchange' | 'levelchange' | 'chargingtimechange' | 'dischargingtimechange',
    _listener: EventListenerOrEventListenerObject
  ): void
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

interface NetworkConnection extends EventTarget {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g'
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown'
  downlink?: number
  downlinkMax?: number
  rtt?: number
  saveData?: boolean
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection
  mozConnection?: NetworkConnection
  webkitConnection?: NetworkConnection
}

/* ------------------------------------------------------------------ */
//  Helpers
/* ------------------------------------------------------------------ */
export function formatTimeSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return 'Calculating…'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/* ------------------------------------------------------------------ */
//  useNetworkStatus
/* ------------------------------------------------------------------ */
export function useNetworkStatus() {
  const [online, setOnline] = useState(true)
  const [effectiveType, setEffectiveType] = useState<NetworkConnection['effectiveType']>(undefined)
  const [connType, setConnType] = useState<NetworkConnection['type']>(undefined)
  const [downlink, setDownlink] = useState<number | undefined>(undefined)
  const [rtt, setRtt] = useState<number | undefined>(undefined)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    setOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const nav = navigator as NavigatorWithConnection
    const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection

    if (!connection) {
      setSupported(false)
    } else {
      setSupported(true)
      const sync = () => {
        setEffectiveType(connection.effectiveType)
        setConnType(connection.type)
        setDownlink(connection.downlink)
        setRtt(connection.rtt)
      }
      sync()
      connection.addEventListener('change', sync)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', sync)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { online, effectiveType, connType, downlink, rtt, supported }
}

/* ------------------------------------------------------------------ */
//  useBatteryStatus
/* ------------------------------------------------------------------ */
export function useBatteryStatus() {
  const [level, setLevel] = useState<number | null>(null)
  const [charging, setCharging] = useState(false)
  const [chargingTime, setChargingTime] = useState<number>(Infinity)
  const [dischargingTime, setDischargingTime] = useState<number>(Infinity)
  const [supported, setSupported] = useState(true)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const nav = navigator as NavigatorWithBattery
    if (!nav.getBattery) {
      setSupported(false)
      return
    }

    let cancelled = false

    nav.getBattery().then((b) => {
      if (cancelled) return

      const sync = () => {
        setLevel(b.level)
        setCharging(b.charging)
        setChargingTime(b.chargingTime)
        setDischargingTime(b.dischargingTime)
      }
      sync()

      b.addEventListener('chargingchange', sync)
      b.addEventListener('levelchange', sync)
      b.addEventListener('chargingtimechange', sync)
      b.addEventListener('dischargingtimechange', sync)

      cleanupRef.current = () => {
        b.removeEventListener('chargingchange', sync)
        b.removeEventListener('levelchange', sync)
        b.removeEventListener('chargingtimechange', sync)
        b.removeEventListener('dischargingtimechange', sync)
      }
    })

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  return { level, charging, chargingTime, dischargingTime, supported }
}

/* ------------------------------------------------------------------ */
//  useAppVolume
/* ------------------------------------------------------------------ */
export function useAppVolume() {
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 75
    const raw = window.localStorage.getItem('arch-app-volume')
    return raw ? Math.min(100, Math.max(0, Number(raw))) : 75
  })
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('arch-app-muted') === 'true'
  })

  const persist = useCallback((v: number, m: boolean) => {
    window.localStorage.setItem('arch-app-volume', String(v))
    window.localStorage.setItem('arch-app-muted', String(m))
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      persist(volume, !m)
      return !m
    })
  }, [volume, persist])

  const adjust = useCallback(
    (v: number) => {
      const clamped = Math.min(100, Math.max(0, v))
      setVolume(clamped)
      const m = clamped === 0
      setMuted(m)
      persist(clamped, m)
    },
    [persist]
  )

  return { volume, muted, toggleMute, adjust }
}

/* ------------------------------------------------------------------ */
//  useNotificationCount
/* ------------------------------------------------------------------ */
export function useNotificationCount() {
  const [count, setCount] = useState(() => {
    if (typeof window === 'undefined') return 0
    const raw = window.localStorage.getItem('arch-tray-notifications')
    return raw ? Math.max(0, Number(raw)) : 0
  })

  const clear = useCallback(() => {
    setCount(0)
    window.localStorage.setItem('arch-tray-notifications', '0')
  }, [])

  return { count, clear }
}

/* ------------------------------------------------------------------ */
//  useServerHealth
/* ------------------------------------------------------------------ */
interface HealthState {
  status: 'healthy' | 'error' | 'degraded'
  db: 'ok' | 'degraded' | 'unavailable' | 'disabled'
  redis: 'ok' | 'degraded' | 'unavailable' | 'disabled'
  fuxa: 'ok' | 'degraded' | 'unavailable' | 'disabled'
  responseTime: number
  timestamp: string
  loading: boolean
  lastFetched: number | null
}

function useServerHealth() {
  const [health, setHealth] = useState<HealthState>({
    status: 'healthy',
    db: 'ok',
    redis: 'ok',
    fuxa: 'ok',
    responseTime: 0,
    timestamp: '',
    loading: true,
    lastFetched: null,
  })

  useEffect(() => {
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-store',
        })
        const data = await res.json()
        if (!cancelled) {
          const statusMap = {
            healthy: 'healthy',
            degraded: 'degraded',
            down: 'error',
          } as const

          const mapServiceStatus = (
            s: { status: 'healthy' | 'degraded' | 'down' } | null | undefined
          ): 'ok' | 'degraded' | 'unavailable' => {
            if (!s) return 'unavailable'
            if (s.status === 'healthy') return 'ok'
            if (s.status === 'degraded') return 'degraded'
            return 'unavailable'
          }

          setHealth({
            status: data.status
              ? (statusMap[data.status as keyof typeof statusMap] ?? 'error')
              : 'error',
            db: mapServiceStatus(data.services?.supabase_realtime),
            redis: mapServiceStatus(data.services?.redis),
            fuxa: mapServiceStatus(data.services?.fuxa),
            responseTime: data.latency_ms ?? 0,
            timestamp: data.last_check ?? '',
            loading: false,
            lastFetched: Date.now(),
          })
        }
      } catch {
        if (!cancelled) {
          setHealth((prev) => ({
            ...prev,
            status: 'error',
            loading: false,
            lastFetched: Date.now(),
          }))
        }
      }
    }

    fetchHealth()

    intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchHealth()
      }
    }, 30000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  return health
}

/* ------------------------------------------------------------------ */
//  Row Components
/* ------------------------------------------------------------------ */

export function NetworkStatusRow({
  online,
  effectiveType,
  connType,
  downlink,
  rtt,
  supported,
}: ReturnType<typeof useNetworkStatus>) {
  const ConnQualityIcon = !online
    ? WifiOff
    : effectiveType === '4g' || effectiveType === '3g'
      ? SignalHigh
      : effectiveType === '2g'
        ? SignalMedium
        : effectiveType === 'slow-2g'
          ? SignalLow
          : Wifi

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
      <ConnQualityIcon
        className={cn(
          'w-4 h-4 shrink-0',
          online ? 'text-arch-accent-green' : 'text-arch-accent-red'
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-arch-text-primary">
            {online ? 'Connected' : 'Offline'}
          </span>
          {effectiveType && (
            <span className="text-[10px] uppercase text-arch-text-muted">{effectiveType}</span>
          )}
        </div>
        {supported && online && (
          <div className="flex items-center gap-2 mt-0.5">
            {connType && (
              <span className="text-[10px] text-arch-text-muted capitalize">{connType}</span>
            )}
            {typeof downlink === 'number' && (
              <span className="text-[10px] text-arch-text-muted">{downlink.toFixed(1)} Mbps</span>
            )}
            {typeof rtt === 'number' && (
              <span className="text-[10px] text-arch-text-muted">{rtt} ms</span>
            )}
          </div>
        )}
        {!supported && (
          <p className="text-[10px] text-arch-text-muted mt-0.5">Network API unavailable</p>
        )}
      </div>
    </div>
  )
}

export function BatteryStatusRow({
  level,
  charging,
  chargingTime,
  dischargingTime,
  supported,
}: ReturnType<typeof useBatteryStatus>) {
  if (!supported || level === null) {
    return (
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
        <BatteryMedium className="w-4 h-4 text-arch-text-secondary" />
        <span className="text-[12px] text-arch-text-muted">Battery status unavailable</span>
      </div>
    )
  }

  const BatteryIcon = charging
    ? BatteryCharging
    : level <= 0.1
      ? BatteryWarning
      : level <= 0.3
        ? BatteryLow
        : level >= 0.8
          ? BatteryFull
          : BatteryMedium

  const batteryColor = charging
    ? 'text-arch-accent-green'
    : level < 0.5
      ? 'text-arch-accent-red'
      : level < 0.7
        ? 'text-arch-accent-amber'
        : 'text-arch-accent-green'

  const barColor = charging
    ? 'bg-arch-accent-green'
    : level < 0.5
      ? 'bg-arch-accent-red'
      : level < 0.7
        ? 'bg-arch-accent-amber'
        : 'bg-arch-accent-green'

  return (
    <div className="px-2 py-1.5 rounded-md space-y-1.5">
      <div className="flex items-center gap-2.5">
        <BatteryIcon className={cn('w-4 h-4 shrink-0', batteryColor)} />
        <div className="flex-1 flex items-center justify-between">
          <span className="text-[12px] font-medium text-arch-text-primary">
            {Math.round(level * 100)}%
          </span>
          <span className="text-[10px] text-arch-text-muted">
            {charging ? 'Charging' : 'On Battery'}
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-arch-surface-tertiary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.round(level * 100)}%` }}
        />
      </div>
      {charging && Number.isFinite(chargingTime) && chargingTime > 0 && (
        <p className="text-[10px] text-arch-accent-green">
          {formatTimeSeconds(chargingTime)} to full
        </p>
      )}
      {!charging && Number.isFinite(dischargingTime) && dischargingTime > 0 && (
        <p className="text-[10px] text-arch-text-muted">
          {formatTimeSeconds(dischargingTime)} remaining
        </p>
      )}
    </div>
  )
}

export function VolumeControlRow({
  volume,
  muted,
  toggleMute,
  adjust,
}: ReturnType<typeof useAppVolume>) {
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const volumeColor = muted || volume === 0 ? 'text-arch-text-muted' : 'text-arch-accent-charcoal'

  return (
    <div className="px-2 py-1.5 rounded-md space-y-1.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="p-0.5 rounded hover:bg-black/[0.06] transition-colors"
        >
          <VolumeIcon className={cn('w-4 h-4', volumeColor)} />
        </button>
        <span className="text-[12px] font-medium text-arch-text-primary min-w-[2rem]">
          {muted ? 'Muted' : `${volume}%`}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={muted ? 0 : volume}
        onChange={(e) => adjust(Number(e.target.value))}
        aria-label="Volume"
        className="w-full accent-arch-accent-charcoal h-1"
      />
    </div>
  )
}

export function NotificationRow({ count, clear }: ReturnType<typeof useNotificationCount>) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
      <div className="relative">
        {count > 0 ? (
          <BellDot className="w-4 h-4 text-arch-text-secondary" />
        ) : (
          <Bell className="w-4 h-4 text-arch-text-secondary" />
        )}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-[3px] rounded-full bg-arch-accent-red text-white text-[9px] font-bold leading-none">
            {count}
          </span>
        )}
      </div>
      <span className="text-[12px] text-arch-text-primary flex-1">
        {count > 0 ? `${count} notification${count === 1 ? '' : 's'}` : 'No notifications'}
      </span>
      {count > 0 && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear notifications"
          className="text-[10px] text-arch-text-muted hover:text-arch-text-secondary transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
//  ServerHealthRow
/* ------------------------------------------------------------------ */
function HealthSubRow({
  label,
  status,
  icon: Icon,
}: {
  label: string
  status: 'ok' | 'degraded' | 'unavailable' | 'disabled'
  icon: React.ComponentType<{ className?: string }>
}) {
  const config = {
    ok: { color: 'text-arch-accent-green', label: 'OK' },
    degraded: { color: 'text-arch-accent-charcoal', label: 'Degraded' },
    unavailable: { color: 'text-arch-accent-red', label: 'Unavailable' },
    disabled: { color: 'text-arch-text-muted', label: 'Disabled' },
  }
  const c = config[status] ?? config.ok

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('w-3 h-3 shrink-0', c.color)} />
      <span className="text-[11px] text-arch-text-secondary flex-1">{label}</span>
      <span className={cn('text-[10px] font-medium', c.color)}>{c.label}</span>
    </div>
  )
}

export function ServerHealthRow({
  status,
  db,
  redis,
  fuxa,
  responseTime,
  loading,
}: Omit<HealthState, 'timestamp' | 'lastFetched'>) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-arch-accent-green',
      label: 'Healthy',
    },
    degraded: {
      icon: MinusCircle,
      color: 'text-arch-accent-charcoal',
      label: 'Degraded',
    },
    error: {
      icon: AlertCircle,
      color: 'text-arch-accent-red',
      label: 'Error',
    },
  }

  const current = statusConfig[status] ?? statusConfig.healthy

  return (
    <div className="px-2 py-1.5 rounded-md space-y-1.5">
      <div className="flex items-center gap-2.5">
        <current.icon className={cn('w-4 h-4 shrink-0', current.color)} />
        <span className="text-[12px] font-medium text-arch-text-primary flex-1">Server Health</span>
        <span className={cn('text-[10px] font-medium', current.color)}>{current.label}</span>
      </div>

      <div className="space-y-1">
        <HealthSubRow label="Database" status={db} icon={Database} />
        <HealthSubRow label="Redis" status={redis} icon={HardDrive} />
        <HealthSubRow label="SCADA (FUXA)" status={fuxa} icon={Zap} />
      </div>

      <div className="flex items-center gap-1.5 text-arch-text-muted">
        <Clock className="w-3 h-3" />
        <span className="text-[10px]">
          {loading ? 'Checking…' : responseTime > 0 ? `${responseTime}ms` : 'Unavailable'}
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────── SystemTrayPill ─────────────────────────── */

export function SystemTrayPill() {
  const network = useNetworkStatus()
  const battery = useBatteryStatus()
  const volume = useAppVolume()
  const notifications = useNotificationCount()
  const health = useServerHealth()

  const healthDotColor = health.loading
    ? 'bg-[var(--text-muted)]'
    : health.status === 'healthy'
      ? 'bg-arch-accent-green'
      : health.status === 'degraded'
        ? 'bg-arch-accent-charcoal'
        : 'bg-arch-accent-red'

  const VolumeIcon =
    volume.muted || volume.volume === 0 ? VolumeX : volume.volume < 50 ? Volume1 : Volume2
  const volumeColor =
    volume.muted || volume.volume === 0 ? 'text-arch-text-muted' : 'text-arch-accent-charcoal'

  const ConnIcon = !network.online ? WifiOff : Wifi
  const connColor = network.online ? 'text-arch-accent-green' : 'text-arch-accent-red'

  const BatteryIcon = battery.charging
    ? BatteryCharging
    : (battery.level ?? 1) <= 0.1
      ? BatteryWarning
      : (battery.level ?? 1) <= 0.3
        ? BatteryLow
        : (battery.level ?? 1) >= 0.8
          ? BatteryFull
          : BatteryMedium

  const batteryColor = battery.charging
    ? 'text-arch-accent-green'
    : battery.level === null
      ? 'text-arch-text-secondary'
      : battery.level < 0.5
        ? 'text-arch-accent-red'
        : battery.level < 0.7
          ? 'text-arch-accent-amber'
          : 'text-arch-accent-green'

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/drilling/tools?tab=tasks"
        className={cn(
          'flex items-center justify-center w-[26px] h-[26px] rounded-full',
          'bg-black/[0.03] hover:bg-black/[0.06] border border-border-subtle',
          'transition-colors active:scale-[0.97]'
        )}
        title="Task Manager"
      >
        <CheckSquare className="w-3.5 h-3.5 text-arch-text-secondary" />
      </Link>

      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label="System Tray Popover"
            title="System status & options"
            className={cn(
              'flex items-center gap-2 h-[26px] px-2.5 rounded-full select-none cursor-default outline-none',
              'bg-black/[0.03] hover:bg-black/[0.06] border border-border-subtle',
              'transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50'
            )}
          >
            {/* Server health dot */}
            <span className="relative flex h-2 w-2">
              {health.status === 'healthy' && !health.loading && (
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-arch-accent-green opacity-75" />
              )}
              <span className={cn('relative inline-flex rounded-full h-2 w-2', healthDotColor)} />
            </span>
            <span className="w-[1px] h-3 bg-border-subtle" />

            <VolumeIcon className={cn('w-3.5 h-3.5', volumeColor)} />
            <span className="w-[1px] h-3 bg-border-subtle" />
            <ConnIcon className={cn('w-3.5 h-3.5', connColor)} />
            <span className="w-[1px] h-3 bg-border-subtle" />
            <div className="flex items-center gap-0.5">
              <BatteryIcon className={cn('w-3.5 h-3.5', batteryColor)} />
              {battery.supported && battery.level !== null && (
                <span className="text-[11px] font-medium text-arch-text-primary leading-none">
                  {Math.round(battery.level * 100)}%
                </span>
              )}
            </div>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={6}
            className={cn(
              'w-64 bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-window rounded-xl p-3 z-[120]',
              'flex flex-col gap-2 select-none focus:outline-none'
            )}
          >
            <div className="space-y-3">
              {/* Server Health Section */}
              <ServerHealthRow
                status={health.status}
                db={health.db}
                redis={health.redis}
                fuxa={health.fuxa}
                responseTime={health.responseTime}
                loading={health.loading}
              />

              <div className="h-[1px] bg-black/[0.05]" />

              {/* Volume Slider Section */}
              <VolumeControlRow {...volume} />

              <div className="h-[1px] bg-black/[0.05]" />

              {/* Network details Section */}
              <NetworkStatusRow {...network} />

              <div className="h-[1px] bg-black/[0.05]" />

              {/* Battery details Section */}
              <BatteryStatusRow {...battery} />

              <div className="h-[1px] bg-black/[0.05]" />

              {/* Notifications Section */}
              <NotificationRow count={notifications.count} clear={notifications.clear} />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}
