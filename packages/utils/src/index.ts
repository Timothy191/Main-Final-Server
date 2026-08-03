/**
 * @repo/utils — shared utility helpers
 */

/** Pause execution for `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Type-safe object entries. */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Format bytes into a human-readable string. */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/** Check if a value is a non-null object. */
export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

/** Remove undefined keys from an object (shallow). */
export function compact<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

/** Merge class names (clsx-lite; filters falsy). */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ')
}

/** Information about the current 3-shift window (A/B/C). */
export interface ThreeShiftInfo {
  shift: 'A' | 'B' | 'C'
  label: string
  start: string
  end: string
}

/**
 * Classify the current 3-shift window (A 06–14, B 14–22, C 22–06)
 * in the given IANA timezone (default Africa/Johannesburg).
 */
export function getThreeShift(
  date: Date = new Date(),
  timeZone = 'Africa/Johannesburg'
): ThreeShiftInfo {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(date)
  const hour = Number.parseInt(hourStr, 10)

  if (hour >= 6 && hour < 14) {
    return { shift: 'A', label: 'Shift A', start: '06:00', end: '14:00' }
  }
  if (hour >= 14 && hour < 22) {
    return { shift: 'B', label: 'Shift B', start: '14:00', end: '22:00' }
  }
  return { shift: 'C', label: 'Shift C', start: '22:00', end: '06:00' }
}

/** Operational calendar date (YYYY-MM-DD) in Africa/Johannesburg. */
export function getOperationalToday(timeZone = 'Africa/Johannesburg'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Lightweight client analytics stub (no-op until a provider is wired). */
/** Lightweight client analytics event payload. */
export interface AnalyticsEvent {
  eventName: string
  properties?: Record<string, unknown>
}

/** No-op analytics stub — logs events in development when DEBUG_ANALYTICS=1. */
export const analytics = {
  track(event: AnalyticsEvent): void {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_ANALYTICS === '1') {
      console.warn('[analytics]', event.eventName, event.properties ?? {})
    }
  },
}
