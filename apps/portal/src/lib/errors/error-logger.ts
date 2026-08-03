/**
 * Error Logging Utility
 *
 * Provides structured error logging for both AppError instances
 * and generic errors. Integrates with monitoring systems.
 */

import * as Sentry from '@sentry/nextjs'
import { serverLogger } from '@repo/logger'

/**
 * Error severity levels
 */
type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Structured error log entry
 */
interface ErrorLogEntry {
  timestamp: string
  severity: ErrorSeverity
  code?: string
  statusCode?: number
  message: string
  context?: Record<string, unknown>
  cause?: unknown
  stack?: string
  url?: string
  method?: string
  userId?: string
  sessionId?: string
}

/**
 * Determine error severity based on status code and error type
 */
function getSeverity(_error: Error, statusCode?: number): ErrorSeverity {
  if (!statusCode) return 'error'
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  return 'info'
}

/**
 * Create a structured error log entry
 */
function createErrorLog(
  error: Error,
  context?: {
    url?: string
    method?: string
    userId?: string
    sessionId?: string
    [key: string]: unknown
  }
): ErrorLogEntry {
  const timestamp = new Date().toISOString()

  // Check if error has AppError-like properties
  const hasAppErrorProps =
    'code' in error && 'statusCode' in error && 'context' in error && 'cause' in error

  if (hasAppErrorProps) {
    const appError = error as Error & {
      code?: string
      statusCode?: number
      context?: Record<string, unknown>
      cause?: unknown
    }
    return {
      timestamp,
      severity: getSeverity(error, appError.statusCode),
      code: appError.code,
      statusCode: appError.statusCode,
      message: error.message,
      context: { ...appError.context, ...context },
      cause: appError.cause,
      stack: error.stack,
      url: context?.url,
      method: context?.method,
      userId: context?.userId,
      sessionId: context?.sessionId,
    }
  }

  // Generic error handling
  return {
    timestamp,
    severity: 'error',
    message: error.message,
    stack: error.stack,
    url: context?.url,
    method: context?.method,
    userId: context?.userId,
    sessionId: context?.sessionId,
  }
}

/**
 * Send error to monitoring service
 *
 * Sends structured error to console (dev) and Sentry (via global init).
 */
async function sendToMonitoring(entry: ErrorLogEntry): Promise<void> {
  const error = new Error(entry.message)
  if (entry.stack) {
    error.stack = entry.stack
  }

  // Forward to structured logger
  const logEntry = {
    timestamp: entry.timestamp,
    statusCode: entry.statusCode,
    context: entry.context,
    url: entry.url,
    method: entry.method,
  }

  if (entry.severity === 'error' || entry.severity === 'fatal') {
    serverLogger().error(`[${entry.code || 'UNKNOWN'}] ${entry.message}`, logEntry)
  } else {
    serverLogger().warn(`[${entry.code || 'UNKNOWN'}] ${entry.message}`, logEntry)
  }

  // Forward server-side errors to Sentry — warn/info are expected control-flow (4xx) and not captured
  if (entry.severity === 'error' || entry.severity === 'fatal') {
    Sentry.captureException(error, {
      extra: {
        code: entry.code,
        statusCode: entry.statusCode,
        context: entry.context,
        url: entry.url,
        method: entry.method,
        userId: entry.userId,
        sessionId: entry.sessionId,
      },
    })
  }
}

/**
 * Main error logger function
 *
 * Usage:
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   await logError(error, { url: req.url, method: req.method });
 * }
 * ```
 */
export async function logError(
  error: Error,
  context?: {
    url?: string
    method?: string
    userId?: string
    sessionId?: string
    [key: string]: unknown
  }
): Promise<void> {
  try {
    const entry = createErrorLog(error, context)
    await sendToMonitoring(entry)
  } catch {
    // logError must never throw - monitoring failures should not crash the app
  }
}

/**
 * Create an API route error handler
 *
 * Wraps API route handlers with automatic error logging
 *
 * Usage:
 * ```typescript
 * export async function POST(req: Request) {
 *   return withErrorLogging(req, async () => {
 *     // Your route logic
 *   });
 * }
 * ```
 */
export async function withErrorLogging<T>(
  req: Request,
  handler: () => Promise<T>,
  options?: {
    userId?: string
    sessionId?: string
  }
): Promise<T> {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof Error) {
      await logError(error, {
        url: req.url,
        method: req.method,
        userId: options?.userId,
        sessionId: options?.sessionId,
      })
    }
    throw error // Re-throw for error boundaries
  }
}

/**
 * Server action error logger
 *
 * Usage in server actions:
 * ```typescript
 * "use server";
 *
 * export async function createUser(data: UserData) {
 *   return await withServerActionLogging(async () => {
 *     // Your action logic
 *   });
 * }
 * ```
 */
export async function withServerActionLogging<T>(
  handler: () => Promise<T>,
  actionName: string
): Promise<T> {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof Error) {
      await logError(error, {
        action: actionName,
      })
    }
    throw error
  }
}
