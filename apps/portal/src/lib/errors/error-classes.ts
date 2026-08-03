/**
 * Re-export consolidated error classes from @repo/errors
 */
export {
  AppError,
  APIError,
  ValidationError,
  AuthError,
  DatabaseError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  RateLimitError,
  TooManyRequestsError,
  WebFetchError,
  ServiceUnavailableError,
  InternalError,
  InternalServerError,
  AIProviderError,
  ExternalServiceError,
  isAppError,
  isValidationError,
  isAuthError,
  isNotFoundError,
  type AppErrorOptions,
  type ErrorCode,
} from '@repo/errors'
