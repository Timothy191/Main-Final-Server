/* eslint-disable no-console */

// @repo/logger — shared structured logging utility
//
// Produces structured JSON in production, human-readable in development.
// All log entries include ISO timestamps and consistent level prefixes.

interface LogEntry {
  timestamp: string
  level: string
  service: string
  message: unknown
  details?: unknown[]
}

interface Logger {
  info: (msg: unknown, ...args: unknown[]) => void
  warn: (msg: unknown, ...args: unknown[]) => void
  error: (msg: unknown, ...args: unknown[]) => void
  debug: (msg: unknown, ...args: unknown[]) => void
}

const IS_DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

function formatTimestamp(): string {
  return new Date().toISOString()
}

function writeEntry(level: string, msg: unknown, args: unknown[]): void {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    service: 'portal',
    message: msg,
    details: args.length > 0 ? args : undefined,
  }

  if (IS_DEV) {
    // Human-readable dev format
    const prefix = `[${level}]`
    if (args.length > 0) {
      const method =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : level === 'debug'
              ? console.debug
              : console.log
      method(prefix, msg, ...args)
    } else {
      const method =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : level === 'debug'
              ? console.debug
              : console.log
      method(prefix, msg)
    }
  } else {
    // Structured JSON for production / log aggregation
    const method =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.log
    method(JSON.stringify(entry))
  }
}

function createServerLogger(): Logger {
  return {
    info: (msg: unknown, ...args: unknown[]) => writeEntry('INFO', msg, args),
    warn: (msg: unknown, ...args: unknown[]) => writeEntry('WARN', msg, args),
    error: (msg: unknown, ...args: unknown[]) => writeEntry('ERROR', msg, args),
    debug: (msg: unknown, ...args: unknown[]) => writeEntry('DEBUG', msg, args),
  }
}

let _logger: Logger | null = null

export function serverLogger(): Logger {
  if (!_logger) {
    _logger = createServerLogger()
  }
  return _logger
}

const defaultLogger = serverLogger()

export default defaultLogger

export function withLogging<T>(handler: T): T {
  return handler
}

export type { Logger as ServerLogger }
