/**
 * @repo/errors — typed application error classes
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

export interface AppErrorOptions {
  code: ErrorCode
  message: string
  status?: number
  cause?: unknown
  meta?: Record<string, unknown>
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly meta?: Record<string, unknown>

  constructor({ code, message, status, cause, meta }: AppErrorOptions) {
    super(message, { cause })
    this.name = 'AppError'
    this.code = code
    this.status = status ?? AppError.defaultStatus(code)
    this.meta = meta
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static defaultStatus(code: ErrorCode): number {
    const map: Record<ErrorCode, number> = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      VALIDATION_ERROR: 422,
      CONFLICT: 409,
      RATE_LIMITED: 429,
      INTERNAL_ERROR: 500,
      SERVICE_UNAVAILABLE: 503,
    }
    return map[code]
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
  constructor(resource = 'Resource', meta?: Record<string, unknown>) {
    super({ code: 'NOT_FOUND', message: `${resource} not found.`, meta })
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super({ code: 'UNAUTHORIZED', message })
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super({ code: 'FORBIDDEN', message })
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super({ code: 'VALIDATION_ERROR', message, meta })
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super({ code: 'RATE_LIMITED', message })
    this.name = 'RateLimitError'
  }
}

export class TooManyRequestsError extends RateLimitError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message)
    this.name = 'TooManyRequestsError'
  }
}

export class WebFetchError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super({ code: 'SERVICE_UNAVAILABLE', message, status: 502, meta })
    this.name = 'WebFetchError'
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Service unavailable. Please try again later.',
    meta?: Record<string, unknown>
  ) {
    super({ code: 'SERVICE_UNAVAILABLE', message, status: 503, meta })
    this.name = 'ServiceUnavailableError'
  }
}

export class InternalError extends AppError {
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
  constructor(message = 'Resource conflict.', meta?: Record<string, unknown>) {
    super({ code: 'CONFLICT', message, status: 409, meta })
    this.name = 'ConflictError'
  }
}

/** Narrow an unknown value to AppError. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}
