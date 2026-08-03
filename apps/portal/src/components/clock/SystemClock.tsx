'use client'

import { useEffect, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@repo/ui/lib/utils'

export function SystemClock() {
  const [dayStr, setDayStr] = useState<string>('')
  const [timeStr, setTimeStr] = useState<string>('')
  const [time, setTime] = useState<Date>(() => new Date())
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date())

  // Update clock time string (day + time) every 10 seconds for the header pill
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      setTime(now)

      const timePart = now.toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Johannesburg',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })

      const dayPart = now.toLocaleDateString('en-GB', {
        timeZone: 'Africa/Johannesburg',
        weekday: 'short',
      })

      setDayStr(dayPart)
      setTimeStr(timePart)
    }
    updateClock()
    const interval = setInterval(updateClock, 10000)
    return () => clearInterval(interval)
  }, [])

  // Update the analog clock every second (independent of the pill updates)
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(secondInterval)
  }, [])

  if (!dayStr || !timeStr) return null

  // Calendar calculations
  const viewYear = calendarDate.getFullYear()
  const viewMonth = calendarDate.getMonth()

  const monthLabel = calendarDate.toLocaleString('en-US', { month: 'long' })
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate()

  const daysArray: (number | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null)
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d)
  }

  // Navigation handlers
  const prevMonth = () => {
    setCalendarDate(new Date(viewYear, viewMonth - 1, 1))
  }
  const nextMonth = () => {
    setCalendarDate(new Date(viewYear, viewMonth + 1, 1))
  }
  const prevYear = () => {
    setCalendarDate(new Date(viewYear - 1, viewMonth, 1))
  }
  const nextYear = () => {
    setCalendarDate(new Date(viewYear + 1, viewMonth, 1))
  }

  // Analog clock hands rotations
  const hours = time.getHours()
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  const hourDeg = ((hours % 12) / 12) * 360 + (minutes / 60) * 30
  const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6
  const secondDeg = (seconds / 60) * 360

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="System Clock"
          title="Clock & Calendar"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-border-subtle transition-colors select-none cursor-default outline-none active:scale-95"
        >
          <span className="font-display text-[11px] font-normal uppercase tracking-[0.22em] text-text-heading leading-none">
            {dayStr}
          </span>
          <span className="font-mono text-[13px] font-medium tabular-nums text-text-heading leading-none">
            {timeStr}
          </span>
          <span className="font-mono text-[10px] text-arch-text-secondary opacity-60 font-medium tracking-wider leading-none uppercase">
            SAST
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className={cn(
            'bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-window rounded-xl p-4 z-[120]',
            'flex gap-5 select-none focus:outline-none'
          )}
        >
          {/* Left panel: Calendar */}
          <div className="w-[185px]">
            {/* Header / Month Controls */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={prevYear}
                  title="Previous Year"
                  aria-label="Previous Year"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/[0.05] text-[12px] font-bold text-arch-text-secondary"
                >
                  &laquo;
                </button>
                <button
                  type="button"
                  onClick={prevMonth}
                  title="Previous Month"
                  aria-label="Previous Month"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/[0.05] text-[12px] font-bold text-arch-text-secondary"
                >
                  &lsaquo;
                </button>
              </div>
              <span className="text-[12px] font-bold text-arch-text-primary">
                {monthLabel.substring(0, 3)} {viewYear}
              </span>
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={nextMonth}
                  title="Next Month"
                  aria-label="Next Month"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/[0.05] text-[12px] font-bold text-arch-text-secondary"
                >
                  &rsaquo;
                </button>
                <button
                  type="button"
                  onClick={nextYear}
                  title="Next Year"
                  aria-label="Next Year"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/[0.05] text-[12px] font-bold text-arch-text-secondary"
                >
                  &raquo;
                </button>
              </div>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-bold text-arch-text-muted mb-1.5">
              <span>SU</span>
              <span>MO</span>
              <span>TU</span>
              <span>WE</span>
              <span>TH</span>
              <span>FR</span>
              <span>SA</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="w-[24px] h-[24px]" />
                }
                const today = new Date()
                const isToday =
                  day === today.getDate() &&
                  viewMonth === today.getMonth() &&
                  viewYear === today.getFullYear()

                return (
                  <div
                    key={`day-${day}`}
                    className={cn(
                      'w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10.5px] font-medium transition-colors',
                      isToday
                        ? 'bg-arch-accent-charcoal text-white font-bold shadow-card'
                        : 'text-arch-text-primary hover:bg-black/[0.04]'
                    )}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel: Analog Clock */}
          <div className="flex flex-col items-center justify-center border-l border-black/[0.06] pl-5 min-w-[120px]">
            {/* Clock Face */}
            <div className="relative w-24 h-24 rounded-full border border-black/[0.08] shadow-inner flex items-center justify-center bg-black/[0.01]">
              {/* Top hour indicator dot */}
              <div className="absolute top-1 w-1 h-1 rounded-full bg-black/20" />
              {/* Bottom hour indicator dot */}
              <div className="absolute bottom-1 w-1 h-1 rounded-full bg-black/20" />
              {/* Left hour indicator dot */}
              <div className="absolute left-1 w-1 h-1 rounded-full bg-black/20" />
              {/* Right hour indicator dot */}
              <div className="absolute right-1 w-1 h-1 rounded-full bg-black/20" />

              {/* Hour hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-[3px] h-6 rounded-full bg-black/85 origin-bottom"
                style={{
                  transform: `translate(-50%, 0) rotate(${hourDeg}deg)`,
                  transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              />
              {/* Minute hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-[2px] h-9 rounded-full bg-black/60 origin-bottom"
                style={{
                  transform: `translate(-50%, 0) rotate(${minuteDeg}deg)`,
                  transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              />
              {/* Second hand */}
              <div
                className="absolute bottom-1/2 left-1/2 w-[1px] h-10 rounded-full bg-arch-accent-red origin-bottom"
                style={{
                  transform: `translate(-50%, 0) rotate(${secondDeg}deg)`,
                  transition: secondDeg === 0 ? 'none' : 'transform 0.1s ease-out',
                }}
              />
              {/* Center Pin */}
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-black border border-white"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            {/* Digital Time text */}
            <span className="text-[11px] font-semibold text-arch-text-secondary mt-3 tabular-nums select-all">
              {time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
