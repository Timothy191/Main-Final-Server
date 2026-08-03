/* eslint-env jest */
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  ConflictError,
  RateLimitError,
  InternalError,
  WebFetchError,
  isAppError,
} from '../index'

describe('AppError Base Class', () => {
  it('should create an error with options object', () => {
    const cause = new Error('Cause error')
    const error = new AppError({
      code: 'NOT_FOUND',
      message: 'Test message',
      status: 404,
      cause,
      meta: { foo: 'bar' },
    })

    expect(error.message).toBe('Test message')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.status).toBe(404)
    expect(error.cause).toBe(cause)
    expect(error.meta).toEqual({ foo: 'bar' })
    expect(error.name).toBe('AppError')
  })

  it('should fallback to default status code when status is omitted', () => {
    const error = new AppError({
      code: 'UNAUTHORIZED',
      message: 'Auth required',
    })
    expect(error.status).toBe(401)
  })

  it('should serialize error to JSON format', () => {
    const error = new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid parameters',
      meta: { field: 'email' },
    })

    expect(error.toJSON()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid parameters',
        meta: { field: 'email' },
      },
    })
  })
})

describe('Domain Error Subclasses', () => {
  it('UnauthorizedError', () => {
    const err = new UnauthorizedError('Custom auth error')
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.status).toBe(401)
    expect(err.message).toBe('Custom auth error')
    expect(err.name).toBe('UnauthorizedError')
  })

  it('ForbiddenError', () => {
    const err = new ForbiddenError('Forbidden action')
    expect(err.code).toBe('FORBIDDEN')
    expect(err.status).toBe(403)
    expect(err.message).toBe('Forbidden action')
    expect(err.name).toBe('ForbiddenError')
  })

  it('NotFoundError', () => {
    const err = new NotFoundError('User', { id: 123 })
    expect(err.code).toBe('NOT_FOUND')
    expect(err.status).toBe(404)
    expect(err.message).toBe('User not found.')
    expect(err.meta).toEqual({ id: 123 })
    expect(err.name).toBe('NotFoundError')
  })

  it('ValidationError', () => {
    const err = new ValidationError('Invalid email format', { field: 'email' })
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.status).toBe(422)
    expect(err.message).toBe('Invalid email format')
    expect(err.meta).toEqual({ field: 'email' })
    expect(err.name).toBe('ValidationError')
  })

  it('TooManyRequestsError / RateLimitError', () => {
    const err = new TooManyRequestsError('Rate limit exceeded')
    expect(err.code).toBe('RATE_LIMITED')
    expect(err.status).toBe(429)
    expect(err.message).toBe('Rate limit exceeded')
    expect(err.name).toBe('TooManyRequestsError')

    const legacyErr = new RateLimitError('Slow down')
    expect(legacyErr.code).toBe('RATE_LIMITED')
    expect(legacyErr.status).toBe(429)
  })

  it('InternalServerError / InternalError', () => {
    const err = new InternalServerError('Internal failure', { context: 'db' })
    expect(err.code).toBe('INTERNAL_ERROR')
    expect(err.status).toBe(500)
    expect(err.message).toBe('Internal failure')
    expect(err.meta).toEqual({ context: 'db' })
    expect(err.name).toBe('InternalServerError')

    const baseInternal = new InternalError()
    expect(baseInternal.status).toBe(500)
  })

  it('ServiceUnavailableError / WebFetchError', () => {
    const err = new ServiceUnavailableError('Maintenance window')
    expect(err.code).toBe('SERVICE_UNAVAILABLE')
    expect(err.status).toBe(503)
    expect(err.message).toBe('Maintenance window')
    expect(err.name).toBe('ServiceUnavailableError')

    const fetchErr = new WebFetchError('Fetch failed')
    expect(fetchErr.code).toBe('SERVICE_UNAVAILABLE')
    expect(fetchErr.status).toBe(502)
  })

  it('ConflictError', () => {
    const err = new ConflictError('Record already exists')
    expect(err.code).toBe('CONFLICT')
    expect(err.status).toBe(409)
    expect(err.message).toBe('Record already exists')
    expect(err.name).toBe('ConflictError')
  })
})

describe('isAppError Type Guard', () => {
  it('should correctly identify AppError instances and subclasses', () => {
    const appErr = new AppError({ code: 'INTERNAL_ERROR', message: 'Base' })
    const valErr = new ValidationError('Bad field')
    const notFoundErr = new NotFoundError('Item')

    expect(isAppError(appErr)).toBe(true)
    expect(isAppError(valErr)).toBe(true)
    expect(isAppError(notFoundErr)).toBe(true)
    expect(isAppError(new Error('Standard Error'))).toBe(false)
    expect(isAppError(null)).toBe(false)
    expect(isAppError(undefined)).toBe(false)
    expect(isAppError({ message: 'Fake' })).toBe(false)
  })
})
