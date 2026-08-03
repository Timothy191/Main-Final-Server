/**
 * @jest-environment node
 */

import { logError, withErrorLogging, withServerActionLogging } from './error-logger'

const mockCaptureException = jest.fn()
jest.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}))

const mockLoggerError = jest.fn()
const mockLoggerWarn = jest.fn()
jest.mock('@repo/logger', () => ({
  serverLogger: () => ({
    error: (...args: unknown[]) => mockLoggerError(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  }),
}))

describe('logError', () => {
  beforeEach(() => {
    mockCaptureException.mockClear()
    mockLoggerError.mockClear()
    mockLoggerWarn.mockClear()
  })

  it('logs a generic error without throwing', async () => {
    const err = new Error('something broke')
    await expect(logError(err)).resolves.toBeUndefined()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('forwards generic errors (no statusCode) to Sentry', async () => {
    const err = new Error('generic 500')
    await logError(err)
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
  })

  it('logs with optional context (url, method)', async () => {
    const err = new Error('route error')
    await expect(logError(err, { url: '/api/test', method: 'POST' })).resolves.toBeUndefined()
  })

  it('logs AppError with statusCode determining severity', async () => {
    const { ValidationError } = await import('@/lib/errors/error-classes')
    const err = new ValidationError('bad input', { field: 'email' })
    await logError(err, { url: '/api/users' })
    expect(mockLoggerWarn).toHaveBeenCalled()
  })

  it('uses warn for 4xx status codes', async () => {
    const { AuthError } = await import('@/lib/errors/error-classes')
    const err = new AuthError('Unauthorized')
    await logError(err)
    expect(mockLoggerWarn).toHaveBeenCalled()
  })

  it('does NOT forward 4xx AppErrors to Sentry', async () => {
    const { AuthError, ValidationError } = await import('@/lib/errors/error-classes')
    await logError(new AuthError('Unauthorized'))
    await logError(new ValidationError('bad input'))
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  it('forwards 5xx AppErrors to Sentry with extra context', async () => {
    const { DatabaseError } = await import('@/lib/errors/error-classes')
    const err = new DatabaseError('DB write failed', {
      operation: 'insert',
      table: 'machines',
    })
    await logError(err, { url: '/api/machines', method: 'POST' })
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        extra: expect.objectContaining({
          code: 'DATABASE_ERROR',
          statusCode: 500,
          url: '/api/machines',
          method: 'POST',
        }),
      })
    )
  })
})

describe('withErrorLogging', () => {
  beforeEach(() => {
    mockLoggerError.mockClear()
    mockCaptureException.mockClear()
  })

  it('returns handler result when no error is thrown', async () => {
    const req = new Request('http://localhost/api/test', { method: 'GET' })
    const result = await withErrorLogging(req, async () => 'ok')
    expect(result).toBe('ok')
  })

  it('re-throws after logging when handler throws', async () => {
    const req = new Request('http://localhost/api/test', { method: 'POST' })
    await expect(
      withErrorLogging(req, async () => {
        throw new Error('handler failed')
      })
    ).rejects.toThrow('handler failed')
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('re-throws non-Error objects without calling logError', async () => {
    const req = new Request('http://localhost/api/test', { method: 'POST' })
    await expect(
      withErrorLogging(req, async () => {
        throw 'string error'
      })
    ).rejects.toBe('string error')
  })

  it('passes userId and sessionId to context', async () => {
    const req = new Request('http://localhost/api/test', { method: 'GET' })
    await expect(
      withErrorLogging(
        req,
        async () => {
          throw new Error('context error')
        },
        { userId: 'u-1', sessionId: 's-1' }
      )
    ).rejects.toThrow('context error')
  })
})

describe('withServerActionLogging', () => {
  beforeEach(() => {
    mockLoggerError.mockClear()
    mockCaptureException.mockClear()
  })

  it('returns handler result on success', async () => {
    const result = await withServerActionLogging(async () => 42, 'createUser')
    expect(result).toBe(42)
  })

  it('re-throws and logs on error', async () => {
    await expect(
      withServerActionLogging(async () => {
        throw new Error('action failed')
      }, 'deleteRecord')
    ).rejects.toThrow('action failed')
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('re-throws non-Error without calling logError', async () => {
    await expect(
      withServerActionLogging(async () => {
        throw 'non-error thrown'
      }, 'someAction')
    ).rejects.toBe('non-error thrown')
  })
})
