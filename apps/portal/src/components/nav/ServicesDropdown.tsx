'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'
import {
  LogOut,
  RotateCcw,
  PowerOff,
  Lock,
  Moon,
  Maximize2,
  ChevronDown,
  Sun,
  CloudSun,
  Wind,
  ShieldAlert,
  Phone,
  ClipboardList,
} from 'lucide-react'
import { fetchWeather, getWindDirection, type WeatherData } from '@/lib/weather-api'

/* ------------------------------------------------------------------ */
//  Shift helpers
/* ------------------------------------------------------------------ */
interface ShiftInfo {
  label: string
  hoursRemaining: number
  isDay: boolean
}

function getShiftInfo(): ShiftInfo {
  const now = new Date()
  const hour = now.getHours()
  const isDay = hour >= 6 && hour < 18
  const hoursRemaining = isDay ? 18 - hour : hour >= 18 ? 30 - hour : 6 - hour
  return {
    label: isDay ? 'Day Shift' : 'Night Shift',
    hoursRemaining,
    isDay,
  }
}

/* ------------------------------------------------------------------ */
//  Safety alerts (localStorage-backed mock for demo)
/* ------------------------------------------------------------------ */
interface SafetyAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: number
}

function useSafetyAlerts() {
  const [alerts, _setAlerts] = useState<SafetyAlert[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem('arch-safety-alerts')
      if (raw) return JSON.parse(raw)
    } catch {
      /* ignore */
    }
    // Seed realistic mining alerts on first load
    const seed: SafetyAlert[] = [
      {
        id: 'sa-1',
        severity: 'warning',
        message: 'High dust levels — Pit B',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'sa-2',
        severity: 'info',
        message: 'Blasting hold lifted — Sector 4',
        timestamp: Date.now() - 7200000,
      },
    ]
    window.localStorage.setItem('arch-safety-alerts', JSON.stringify(seed))
    return seed
  })

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length

  return { alerts, criticalCount, warningCount, total: alerts.length }
}

/**
 * System Tray toggle – unified services menu for mining operations.
 * Shows environmental conditions, shift status, safety alerts,
 * and quick emergency actions.
 */
export function ServicesDropdown() {
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [sleeping, setSleeping] = useState(false)
  const [shutDown, setShutDown] = useState(false)

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  const shift = useMemo(() => getShiftInfo(), [])
  const safety = useSafetyAlerts()

  useEffect(() => {
    let cancelled = false
    fetchWeather(-26.35914, 28.79267, 'Delmas, Mpumalanga')
      .then((data) => {
        if (!cancelled) {
          setWeather(data)
          setWeatherLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setWeatherLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="System Tray"
            aria-haspopup="menu"
            aria-expanded={open}
            title="System Tray (Alt+S)"
            className={cn(
              'relative flex items-center justify-center w-7 h-7 rounded-full',
              'bg-black/[0.03] hover:bg-black/[0.06] border border-border-subtle',
              'text-arch-text-secondary',
              'active:scale-[0.97]',
              'transition-all duration-150 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50',
              'cursor-default select-none',
              open && 'bg-black/[0.06]'
            )}
          >
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200 ease-out',
                open && 'rotate-180'
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-80 bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-window rounded-lg overflow-hidden"
          align="end"
          sideOffset={6}
        >
          {/* ── Environmental & Operations Status ── */}
          <div className="grid grid-cols-2 gap-2 p-2">
            {/* Weather */}
            <div className="bg-black/[0.02] border border-black/[0.05] rounded-md p-2.5">
              {weatherLoading || !weather ? (
                <div className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-arch-text-muted animate-pulse" />
                  <span className="text-[11px] text-arch-text-muted">Loading…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="text-xl leading-none">{weather.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-arch-text-primary leading-tight">
                      {weather.temperature}°C
                    </div>
                    <div className="text-[10px] text-arch-text-muted truncate">
                      {weather.description}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shift */}
            <div className="bg-black/[0.02] border border-black/[0.05] rounded-md p-2.5">
              <div className="flex items-center gap-2.5">
                {shift.isDay ? (
                  <Sun className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-arch-accent-charcoal shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-arch-text-primary leading-tight">
                    {shift.label}
                  </div>
                  <div className="text-[10px] text-arch-text-muted">
                    {shift.hoursRemaining}h remaining
                  </div>
                </div>
              </div>
            </div>

            {/* Wind / Visibility */}
            <div className="col-span-2 bg-black/[0.02] border border-black/[0.05] rounded-md p-2.5">
              {weatherLoading || !weather ? (
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-arch-text-muted animate-pulse" />
                  <span className="text-[11px] text-arch-text-muted">Loading conditions…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-arch-text-secondary shrink-0" />
                  <span className="text-[12px] font-medium text-arch-text-primary">
                    {weather.windSpeed} km/h
                  </span>
                  <span className="text-[10px] text-arch-text-muted">
                    {getWindDirection(weather.windDirection)}
                  </span>
                  <span className="ml-auto text-[10px] text-arch-accent-green font-medium">
                    Visibility OK
                  </span>
                </div>
              )}
            </div>

            {/* Safety Alert Summary */}
            <div className="col-span-2 bg-black/[0.02] border border-black/[0.05] rounded-md p-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className={cn(
                    'w-4 h-4 shrink-0',
                    safety.criticalCount > 0
                      ? 'text-arch-accent-red'
                      : safety.warningCount > 0
                        ? 'text-[var(--accent-orange)]'
                        : 'text-arch-accent-green'
                  )}
                />
                <span className="text-[12px] text-arch-text-primary flex-1">
                  {safety.total === 0
                    ? 'No active alerts'
                    : `${safety.total} active alert${safety.total === 1 ? '' : 's'}`}
                </span>
                {safety.criticalCount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-arch-accent-red px-1.5 py-0.5 rounded-full">
                    {safety.criticalCount}
                  </span>
                )}
                {safety.warningCount > 0 && safety.criticalCount === 0 && (
                  <span className="text-[10px] font-bold text-white bg-[var(--accent-orange)] px-1.5 py-0.5 rounded-full">
                    {safety.warningCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-black/[0.06] mx-2" />

          {/* ── Quick Actions (2-column grid) ── */}
          <div className="grid grid-cols-2 gap-1.5 p-2">
            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-black/[0.02] border border-black/[0.05] text-left hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => window.location.reload()}
            >
              <RotateCcw className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">Reload</span>
              <span className="ml-auto text-[10px] text-arch-text-muted">⌘R</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-black/[0.02] border border-black/[0.05] text-left hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {})
                } else if (document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {})
                }
              }}
            >
              <Maximize2 className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">Fullscreen</span>
              <span className="ml-auto text-[10px] text-arch-text-muted">⌃⌘F</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-black/[0.02] border border-black/[0.05] text-left hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => {
                window.location.href = '/safety/daily-log'
              }}
            >
              <ClipboardList className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">
                Daily Safety Log
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-black/[0.02] border border-black/[0.05] text-left hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => {
                window.location.href = '/safety'
              }}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">
                Safety Dashboard
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="col-span-2 flex items-center gap-2 px-2.5 py-2 rounded-md bg-arch-accent-red/[0.06] border border-arch-accent-red/20 text-left hover:bg-arch-accent-red/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-red/50"
              onSelect={() => window.open('tel:+27170000000', '_self')}
            >
              <Phone className="h-3.5 w-3.5 text-arch-accent-red shrink-0" />
              <span className="text-[12px] font-semibold text-arch-accent-red">Emergency Line</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="bg-black/[0.06] mx-2" />

          {/* ── Power Options footer ── */}
          <div className="p-1.5">
            <DropdownMenuItem
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => setLocked(true)}
            >
              <Lock className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">Lock Screen</span>
              <span className="ml-auto text-[10px] text-arch-text-muted">⌃⌘Q</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => setSleeping(true)}
            >
              <Moon className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">Sleep</span>
            </DropdownMenuItem>

            <form action="/api/auth/logout" method="POST">
              <DropdownMenuItem asChild className="rounded-md">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
                >
                  <LogOut className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
                  <span className="text-[12px] font-medium text-arch-text-primary">Log Out</span>
                  <span className="ml-auto text-[10px] text-arch-text-muted">⇧⌘Q</span>
                </button>
              </DropdownMenuItem>
            </form>

            <DropdownMenuItem
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
              onSelect={() => window.location.reload()}
            >
              <RotateCcw className="h-3.5 w-3.5 text-arch-text-secondary shrink-0" />
              <span className="text-[12px] font-medium text-arch-text-primary">Restart…</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-arch-accent-red/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-red/50"
              onSelect={() => setShutDown(true)}
            >
              <PowerOff className="h-3.5 w-3.5 text-arch-accent-red shrink-0" />
              <span className="text-[12px] font-medium text-arch-accent-red">Shut Down…</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Screen Lock Overlay ── */}
      {locked && (
        <div
          role="dialog"
          aria-label="Screen locked"
          className="fixed inset-0 z-[9999] backdrop-blur-xl bg-black/20 flex flex-col items-center justify-center gap-3 cursor-pointer"
          onClick={() => setLocked(false)}
        >
          <Lock className="w-8 h-8 text-white/60" />
          <span className="text-sm text-white/60 font-medium">Click anywhere to unlock</span>
        </div>
      )}

      {/* ── Sleep Overlay ── */}
      {sleeping && (
        <div
          role="dialog"
          aria-label="System sleeping"
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-3 cursor-pointer"
          onClick={() => setSleeping(false)}
        >
          <Moon className="w-8 h-8 text-white/40" />
          <span className="text-sm text-white/40 font-medium">Click anywhere to wake</span>
        </div>
      )}

      {/* ── Shut Down Overlay ── */}
      {shutDown && (
        <div
          role="dialog"
          aria-label="System shut down"
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center gap-3"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="rgba(255,255,255,0.3)"
            aria-hidden="true"
          >
            <path d="M12 2L2 22h4.5L12 8.5 17.5 22H22L12 2z" />
          </svg>
          <span className="text-sm text-white/60 font-medium">
            It is now safe to turn off your computer.
          </span>
        </div>
      )}
    </>
  )
}
