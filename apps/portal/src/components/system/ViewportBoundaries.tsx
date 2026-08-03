'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSystemMetrics } from '@/hooks/useSystemMetrics'
import { useSplitWindow } from '@/hooks/useSplitWindow'
import { cn } from '@repo/ui/lib/utils'
import {
  Clock,
  Wifi,
  WifiOff,
  LayoutDashboard,
  Map as MapIcon,
  Wrench,
  Bell,
  Settings,
  Command,
  ChevronsUp,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface ViewportBoundariesProps {
  className?: string
}

const DOCK_APPS = [
  { name: 'Hub', icon: LayoutDashboard, href: '/' },
  { name: 'Drilling', icon: MapIcon, href: '/drilling' },
  { name: 'Engineering', icon: Wrench, href: '/engineering' },
  { name: 'Alerts', icon: Bell, href: '/safety' },
  { name: 'Settings', icon: Settings, href: '/admin' },
]

const HIDE_DELAY_MS = 280

/**
 * ViewportBoundaries
 *
 * Layout component that positions system status displays at the viewport edges
 * using pointer-events-none wrapper to prevent overlapping or blocking main workspace layouts.
 * Automatically shifts bottom right widgets to avoid overlapping persistent split-pane windows.
 *
 * Bottom dock auto-hides by default; a peeker + hot-zone reveal it on proximity.
 */
export function ViewportBoundaries({ className }: ViewportBoundariesProps) {
  const { websocketLatency, serverTimeSAST, currentShift, online } = useSystemMetrics()
  const splitWindowOpen = useSplitWindow((s) => s.isOpen)
  const pathname = usePathname()

  const [revealed, setRevealed] = useState(false)
  const [pinned, setPinned] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(false)

  useEffect(() => {
    pinnedRef.current = pinned
  }, [pinned])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const hideDock = useCallback(() => {
    clearHideTimer()
    setPinned(false)
    pinnedRef.current = false
    setRevealed(false)
  }, [clearHideTimer])

  const showDock = useCallback(() => {
    clearHideTimer()
    setRevealed(true)
  }, [clearHideTimer])

  const scheduleHide = useCallback(() => {
    if (pinnedRef.current) return
    const active = document.activeElement
    if (active && shellRef.current?.contains(active)) return

    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      if (pinnedRef.current) return
      const stillFocused = document.activeElement
      if (stillFocused && shellRef.current?.contains(stillFocused)) return
      setRevealed(false)
      hideTimerRef.current = null
    }, HIDE_DELAY_MS)
  }, [clearHideTimer])

  const toggleDock = useCallback(() => {
    clearHideTimer()
    setRevealed((prev) => {
      const next = !prev
      setPinned(next)
      pinnedRef.current = next
      return next
    })
  }, [clearHideTimer])

  useEffect(() => {
    return () => clearHideTimer()
  }, [clearHideTimer])

  useEffect(() => {
    if (!revealed) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        hideDock()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [revealed, hideDock])

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-3 select-none',
        className
      )}
    >
      {/* Top boundary space (Menu bar is at top-0 z-50, we leave this transparent) */}
      <div className="w-full flex justify-between pointer-events-none" />

      {/* Middle boundary space (Left and Right edges reserved for future tools/panels) */}
      <div className="flex-1 w-full flex justify-between items-center pointer-events-none">
        <div className="flex flex-col gap-2 items-start pointer-events-auto" />
        <div className="flex flex-col gap-2 items-end pointer-events-auto" />
      </div>

      {/* Bottom boundary — auto-hide dock + peeker */}
      <div className="w-full flex justify-center pb-2 pointer-events-none os-shell-enter-3">
        <div
          ref={shellRef}
          className="relative hidden md:flex flex-col items-center pointer-events-auto"
          onPointerEnter={showDock}
          onPointerLeave={scheduleHide}
        >
          {/* Invisible hot-zone: proximity at bottom edge reveals dock */}
          <div
            data-testid="dock-hot-zone"
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[min(100vw,56rem)] h-12"
          />

          {/* Dock sits above peeker; does not reserve layout height when hidden */}
          <div
            id="unified-dock"
            data-testid="unified-dock"
            data-state={revealed ? 'revealed' : 'hidden'}
            aria-hidden={!revealed}
            className={cn(
              'absolute bottom-full left-1/2 mb-2',
              'os-shell os-shell--dock px-3 py-2',
              'flex items-center gap-4 whitespace-nowrap',
              'transition-all duration-300 ease-glass motion-reduce:transition-none',
              revealed ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
              revealed
                ? splitWindowOpen
                  ? '-translate-x-1/2 sm:-translate-x-[calc(50%+200px)] translate-y-0'
                  : '-translate-x-1/2 translate-y-0'
                : splitWindowOpen
                  ? '-translate-x-1/2 sm:-translate-x-[calc(50%+200px)] translate-y-[calc(100%+20px)]'
                  : '-translate-x-1/2 translate-y-[calc(100%+20px)]'
            )}
          >
            {/* 1. Anchor / Start Button */}
            <div className="flex items-center">
              <button
                type="button"
                aria-label="Start Menu"
                tabIndex={revealed ? 0 : -1}
                className="group relative flex items-center gap-2 p-2 px-3 rounded-xl hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-blue/50"
              >
                <Command className="w-4 h-4 text-arch-text-primary group-hover:scale-110 transition-transform duration-300 ease-glass" />
                <span className="text-xs font-medium text-arch-text-primary">Start</span>
              </button>
            </div>

            <div className="h-6 w-px bg-black/[0.08]" />

            {/* 2. App Dock */}
            <div className="flex items-center gap-1.5">
              {DOCK_APPS.map((app) => {
                const isActive = pathname?.startsWith(app.href)
                const Icon = app.icon
                return (
                  <Link
                    key={app.name}
                    href={app.href}
                    tabIndex={revealed ? 0 : -1}
                    className={cn(
                      'group relative flex items-center gap-2 p-2 px-3 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-blue/50',
                      isActive ? 'bg-black/5' : 'hover:bg-black/5'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform duration-300 ease-glass group-hover:scale-110 group-hover:-translate-y-0.5',
                        isActive
                          ? 'text-arch-accent-charcoal'
                          : 'text-arch-text-secondary group-hover:text-arch-text-primary'
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium transition-colors duration-300',
                        isActive
                          ? 'text-arch-accent-charcoal'
                          : 'text-arch-text-secondary group-hover:text-arch-text-primary'
                      )}
                    >
                      {app.name}
                    </span>

                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-arch-accent-charcoal shadow-[0_0_8px_var(--accent-blue)]" />
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="h-6 w-px bg-black/[0.08]" />

            {/* 3. System Tray */}
            <div className="flex items-center gap-3.5 px-2 text-xs">
              <div className="group relative flex items-center gap-1.5 cursor-default">
                {online ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span className="text-arch-text-secondary font-medium tabular-nums group-hover:text-arch-text-primary transition-colors">
                  {websocketLatency} ms
                </span>

                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none transition-all duration-200 px-2.5 py-1 rounded-md bg-black/80 text-white text-[10px] font-medium whitespace-nowrap shadow-card">
                  Network RTT
                </div>
              </div>

              <div className="group relative flex items-center gap-1.5 cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-arch-text-secondary font-medium group-hover:text-arch-text-primary transition-colors">
                  {currentShift.label}
                </span>

                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none transition-all duration-200 px-2.5 py-1 rounded-md bg-black/80 text-white text-[10px] font-medium whitespace-nowrap shadow-card">
                  {currentShift.start} - {currentShift.end}
                </div>
              </div>

              <div className="group relative flex items-center gap-1.5 text-arch-text-primary font-semibold cursor-default">
                <Clock className="w-3.5 h-3.5 text-arch-accent-charcoal" />
                <span className="tabular-nums">{serverTimeSAST}</span>

                <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none transition-all duration-200 px-2.5 py-1 rounded-md bg-black/80 text-white text-[10px] font-medium whitespace-nowrap shadow-card origin-bottom-right">
                  South Africa Standard Time
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="dock-peeker"
            aria-label={revealed ? 'Hide dock' : 'Show dock'}
            aria-expanded={revealed}
            aria-controls="unified-dock"
            title={revealed ? 'Hide dock' : 'Show dock'}
            onClick={toggleDock}
            onFocus={showDock}
            className={cn(
              'relative z-10 flex h-7 items-center justify-center gap-1 rounded-full px-3',
              'bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05]',
              'text-arch-text-secondary hover:text-arch-text-primary',
              'transition-all duration-200 ease-glass motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50',
              'active:scale-[0.97] cursor-default select-none',
              revealed && 'opacity-60 hover:opacity-100'
            )}
          >
            <ChevronsUp
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                revealed && 'rotate-180'
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  )
}
