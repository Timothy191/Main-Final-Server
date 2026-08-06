/**
 * @repo/errors — Canonical typed application error classes for Arch Systems
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'AUTH_ERROR'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'API_ERROR'
  | 'DATABASE_ERROR'
  | 'AI_PROVIDER_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | (string & {})

export interface AppErrorOptions {
  code?: ErrorCode
  message?: string
  status?: number
  statusCode?: number
  cause?: unknown
  meta?: Record<string, unknown>
  context?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Option keys that are NOT metadata. Every other key on an `AppErrorOptions`
 * object is treated as metadata and merged into `meta` — this preserves the
 * pre-expansion contract where callers passed arbitrary metadata (e.g.
 * `{ issues }`, `{ resource, action }`, `{ field, value }`) as the 2nd arg and
 * expected it to surface on `err.meta`. The expansion to `AppErrorOptions`
 * must not silently drop those keys.
 *
 * AGENT-TRACE: `field`/`value` are intentionally NOT in this set — they are
 * caller metadata, not core error fields, so they flow into `meta` naturally.
 */
const CORE_OPTION_KEYS = new Set([
  'code',
  'message',
  'status',
  'statusCode',
  'cause',
  'meta',
  'context',
])

/** Extract non-core option keys as a metadata record. */
function extractExtraMeta(options: AppErrorOptions): Record<string, unknown> {
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(options)) {
    if (!CORE_OPTION_KEYS.has(key) && value !== undefined) {
      extra[key] = value
    }
  }
  return extra
}

/** Resolve the final `meta`: explicit `meta`/`context` first, then any extra
 *  non-core keys (callers' ad-hoc metadata). Explicit `meta` wins on conflict. */
function resolveMeta(options: AppErrorOptions): Record<string, unknown> | undefined {
  const explicit = options.meta ?? options.context
  const extra = extractExtraMeta(options)
  if (!explicit && Object.keys(extra).length === 0) return undefined
  return { ...(extra ?? {}), ...(explicit ?? {}) }
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly meta?: Record<string, unknown>

  get statusCode(): number {
    return this.status
  }

  get context(): Record<string, unknown> | undefined {
    return this.meta
  }

  constructor(message: string, codeOrOptions?: string | AppErrorOptions, statusCode?: number)
  constructor(options: AppErrorOptions)
  constructor(
    messageOrOptions: string | AppErrorOptions,
    codeOrOptions?: string | AppErrorOptions,
    statusCodeParam?: number
  ) {
    let message = ''
    let code: string = 'INTERNAL_ERROR'
    let status = 500
    let cause: unknown
    let meta: Record<string, unknown> | undefined

    if (typeof messageOrOptions === 'string') {
      message = messageOrOptions
      if (typeof codeOrOptions === 'string') {
        code = codeOrOptions
        status = statusCodeParam ?? AppError.defaultStatus(code)
      } else if (codeOrOptions && typeof codeOrOptions === 'object') {
        code = codeOrOptions.code ?? 'INTERNAL_ERROR'
        status = codeOrOptions.status ?? codeOrOptions.statusCode ?? AppError.defaultStatus(code)
        cause = codeOrOptions.cause
        meta = resolveMeta(codeOrOptions)
      }
    } else if (messageOrOptions && typeof messageOrOptions === 'object') {
      message = messageOrOptions.message ?? ''
      code = messageOrOptions.code ?? 'INTERNAL_ERROR'
      status =
        messageOrOptions.status ?? messageOrOptions.statusCode ?? AppError.defaultStatus(code)
      cause = messageOrOptions.cause
      meta = resolveMeta(messageOrOptions)
    }

    super(message, { cause })
    this.name = this.constructor.name
    this.code = code
    this.status = status
    this.meta = meta

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    } else {
      Object.setPrototypeOf(this, new.target.prototype)
    }
  }

  static defaultStatus(code: ErrorCode): number {
    const map: Record<ErrorCode, number> = {
      UNAUTHORIZED: 401,
      AUTH_ERROR: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      VALIDATION_ERROR: 422,
      CONFLICT: 409,
      RATE_LIMITED: 429,
      INTERNAL_ERROR: 500,
      SERVICE_UNAVAILABLE: 503,
      API_ERROR: 500,
      DATABASE_ERROR: 500,
      AI_PROVIDER_ERROR: 502,
      EXTERNAL_SERVICE_ERROR: 502,
    }
    return map[code] ?? 500
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.meta ? { meta: this.meta } : {}),
      },
    }
  }
}

export class NotFoundError extends AppError {
  // AGENT-TRACE: signature kept as (resource, meta) — the 2nd arg is metadata,
  // not AppErrorOptions, and the message appends " not found." (existing contract).
  constructor(resource = 'Resource', meta?: Record<string, unknown>) {
    super({ code: 'NOT_FOUND', message: `${resource} not found.`, meta })
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.', options?: AppErrorOptions) {
    super(message, { code: 'UNAUTHORIZED', status: 401, ...options })
    this.name = 'UnauthorizedError'
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication failed', options?: AppErrorOptions) {
    super(message, { code: 'AUTH_ERROR', status: 401, ...options })
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action.',
    options?: AppErrorOptions
  ) {
    super(message, { code: 'FORBIDDEN', status: 403, ...options })
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  // AGENT-TRACE: `field`/`value` (and any other ad-hoc keys like `issues`)
  // flow into `meta` via AppError's `resolveMeta` — the pre-expansion contract
  // was `ValidationError(message, meta?: Record)`, so arbitrary metadata keys
  // must still surface on `err.meta`. The typed `field`/`value` options are
  // kept for ergonomics; they are NOT core fields, so they become meta.
  constructor(message: string, options?: AppErrorOptions & { field?: string; value?: unknown }) {
    super(message, { ...options, code: 'VALIDATION_ERROR' })
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', options?: AppErrorOptions) {
    super(message, { code: 'RATE_LIMITED', status: 429, ...options })
    this.name = 'RateLimitError'
  }
}

export class TooManyRequestsError extends RateLimitError {
  constructor(message = 'Too many requests. Please try again later.', options?: AppErrorOptions) {
    super(message, options)
    this.name = 'TooManyRequestsError'
  }
}

export class WebFetchError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, { code: 'SERVICE_UNAVAILABLE', status: 502, ...options })
    this.name = 'WebFetchError'
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable. Please try again later.', options?: AppErrorOptions) {
    super(message, { code: 'SERVICE_UNAVAILABLE', status: 503, ...options })
    this.name = 'ServiceUnavailableError'
  }
}

export class InternalError extends AppError {
  // AGENT-TRACE: signature kept as (message, meta) — the 2nd arg is metadata,
  // not AppErrorOptions (existing contract).
  constructor(message = 'An unexpected internal error occurred.', meta?: Record<string, unknown>) {
    super({ code: 'INTERNAL_ERROR', message, status: 500, meta })
    this.name = 'InternalError'
  }
}

export class InternalServerError extends InternalError {
  constructor(message = 'An unexpected internal error occurred.', meta?: Record<string, unknown>) {
    super(message, meta)
    this.name = 'InternalServerError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict.', options?: AppErrorOptions) {
    super(message, { code: 'CONFLICT', status: 409, ...options })
    this.name = 'ConflictError'
  }
}

export class APIError extends AppError {
  public response?: Response

  constructor(message: string, responseOrOptions?: Response | AppErrorOptions) {
    let response: Response | undefined
    let status = 500
    let options: AppErrorOptions = {}

    if (responseOrOptions instanceof Response) {
      response = responseOrOptions
      status = response.status
    } else if (responseOrOptions) {
      options = responseOrOptions
      status = options.status ?? options.statusCode ?? 500
    }

    super(message, { code: 'API_ERROR', status, ...options })
    this.name = 'APIError'
    this.response = response
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, { code: 'DATABASE_ERROR', status: 500, ...options })
    this.name = 'DatabaseError'
  }
}

export class AIProviderError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, { code: 'AI_PROVIDER_ERROR', status: 502, ...options })
    this.name = 'AIProviderError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, { code: 'EXTERNAL_SERVICE_ERROR', status: 502, ...options })
    this.name = 'ExternalServiceError'
  }
}

/** Narrow an unknown value to AppError. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

export function isValidationError(err: unknown): err is ValidationError {
  return err instanceof ValidationError
}

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof AuthError || err instanceof UnauthorizedError
}

export function isNotFoundError(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError
}

/** True when an error represents a transient network drop or temporary service outage. */
export function isTransientError(err: unknown): boolean {
  if (!err) return false
  if (err instanceof ServiceUnavailableError || err instanceof WebFetchError) return true
  if (err instanceof AppError && (err.status === 502 || err.status === 503 || err.status === 504))
    return true
  if (typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: unknown }).message)
    return (
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('fetch failed') ||
      msg.includes('network error')
    )
  }
  return false
}
