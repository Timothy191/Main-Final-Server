/**
 * Simple error classes to replace @repo/errors package
 */
/* AGENT-TRACE: File-level eslint-disable for no-unused-vars
 * These public constructor parameters define the error interface but are flagged as unused by ESLint
 * This is intentional - they are part of the public API for the error classes
 * If modifying error handling, maintain this pattern or consider re-integrating @repo/errors
 */

export class AppError extends Error {
  public code?: string
  public statusCode?: number
  public context?: Record<string, unknown>
  public cause?: unknown

  constructor(message: string, code?: string, statusCode?: number)
  constructor(
    message: string,
    options?: {
      code?: string
      statusCode?: number
      context?: Record<string, unknown>
      cause?: unknown
      [key: string]: unknown
    }
  )
  constructor(
    message: string,
    codeOrOptions?:
      | string
      | {
          code?: string
          statusCode?: number
          context?: Record<string, unknown>
          cause?: unknown
          [key: string]: unknown
        },
    statusCode?: number
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)

    if (typeof codeOrOptions === 'string') {
      this.code = codeOrOptions
      this.statusCode = statusCode ?? 500
    } else if (codeOrOptions && typeof codeOrOptions === 'object') {
      this.code = codeOrOptions.code
      this.statusCode = codeOrOptions.statusCode ?? 500
      this.context = codeOrOptions.context
      this.cause = codeOrOptions.cause
    }
  }
}

type AppErrorMeta = {
  statusCode?: number
  context?: Record<string, unknown>
  cause?: unknown
  [key: string]: unknown
}

function mergeExtra(
  base: Record<string, unknown> | undefined,
  extra: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...base, ...extra }
  for (const key of Object.keys(next)) {
    if (key === 'context' || key === 'cause') {
      delete (extra as Record<string, unknown>)[key]
      delete next[key]
    }
  }
  for (const key of Object.keys(extra)) {
    ;(next as Record<string, unknown>)[key] = (extra as Record<string, unknown>)[key]
  }
  return next
}

export class APIError extends AppError {
  public response?: Response

  constructor(message: string, response?: Response)
  constructor(
    message: string,
    options?: {
      statusCode?: number
      context?: Record<string, unknown>
      cause?: unknown
      [key: string]: unknown
    }
  )
  constructor(message: string, responseOrOptions?: Response | AppErrorMeta) {
    let statusCode: number | undefined
    let response: Response | undefined
    let context: Record<string, unknown> | undefined
    let cause: unknown
    let extra: Record<string, unknown> = {}

    if (responseOrOptions) {
      if (
        responseOrOptions instanceof Response &&
        typeof (responseOrOptions as Response).status === 'number'
      ) {
        response = responseOrOptions as Response
        statusCode = (responseOrOptions as unknown as Response).status
      } else {
        const meta = responseOrOptions as AppErrorMeta
        statusCode = meta.statusCode
        context = meta.context
        cause = meta.cause
        const { statusCode: _, context: __, cause: ___, ...rest } = meta
        extra = (rest ?? {}) as Record<string, unknown>
      }
    }
    super(message, 'API_ERROR', statusCode ?? 500)
    this.response = response
    if (context) this.context = context
    if (cause) this.cause = cause
    const resolvedContext = mergeExtra(this.context, extra)
    if (Object.keys(resolvedContext).length > 0) {
      this.context = resolvedContext
    }
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    options?: {
      field?: string
      value?: unknown
      context?: Record<string, unknown>
      cause?: unknown
      [key: string]: unknown
    }
  ) {
    const extra = {
      ...(options?.field && { field: options.field }),
      ...(options?.value !== undefined && { value: options.value }),
    }
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      cause: options?.cause,
      context: { ...options?.context, ...extra },
    })
    const { field: _field, value: _value, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export class AuthError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'AUTH_ERROR',
      statusCode: 401,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'DATABASE_ERROR',
      statusCode: 500,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'NOT_FOUND',
      statusCode: 404,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource conflict',
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'CONFLICT',
      statusCode: 409,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = 'Access forbidden',
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'FORBIDDEN',
      statusCode: 403,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

export class AIProviderError extends AppError {
  constructor(
    message: string,
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'AI_PROVIDER_ERROR',
      statusCode: 502,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    options?: {
      cause?: unknown
      context?: Record<string, unknown>
      [key: string]: unknown
    }
  ) {
    super(message, {
      code: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 502,
      cause: options?.cause,
      context: options?.context,
    })
    const { cause: _cause, context: _context, ...rest } = options ?? {}
    const merged = mergeExtra(this.context, (rest as Record<string, unknown>) ?? {})
    if (Object.keys(merged).length > 0) {
      this.context = merged
    }
  }
}
