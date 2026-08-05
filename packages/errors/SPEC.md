# @repo/errors — Specification

Canonical typed application error hierarchy, status code mapping, and metadata propagation engine.

## 1. Overview & Architecture

`@repo/errors` standardizes error handling across server actions, API routes, middleware, and subpackages. All error classes extend `AppError`, preserving metadata and standardizing JSON representations for API responses.

---

## 2. Exported Specification

### 2.1 Types & Base Class

```typescript
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
```

#### `AppError extends Error`

- **Properties:** `code: ErrorCode`, `status: number`, `statusCode: number`, `meta?: Record<string, unknown>`, `context?: Record<string, unknown>`
- **Methods:** `toJSON()`, `static defaultStatus(code: ErrorCode): number`

### 2.2 Derived Error Classes

| Class                     | Default Code             | Default Status | Description                    |
| :------------------------ | :----------------------- | :------------- | :----------------------------- |
| `NotFoundError`           | `NOT_FOUND`              | 404            | Resource missing               |
| `UnauthorizedError`       | `UNAUTHORIZED`           | 401            | Missing authentication         |
| `AuthError`               | `AUTH_ERROR`             | 401            | Failed authentication          |
| `ForbiddenError`          | `FORBIDDEN`              | 403            | Insufficient permissions       |
| `ValidationError`         | `VALIDATION_ERROR`       | 422            | Input validation failed        |
| `RateLimitError`          | `RATE_LIMITED`           | 429            | Rate limit exceeded            |
| `TooManyRequestsError`    | `RATE_LIMITED`           | 429            | Alias for RateLimitError       |
| `WebFetchError`           | `SERVICE_UNAVAILABLE`    | 502            | External fetch failure         |
| `ServiceUnavailableError` | `SERVICE_UNAVAILABLE`    | 503            | Service unavailable            |
| `InternalError`           | `INTERNAL_ERROR`         | 500            | Unexpected internal failure    |
| `InternalServerError`     | `INTERNAL_ERROR`         | 500            | Alias for InternalError        |
| `ConflictError`           | `CONFLICT`               | 409            | Resource state conflict        |
| `APIError`                | `API_ERROR`              | 500            | Third-party API response error |
| `DatabaseError`           | `DATABASE_ERROR`         | 500            | Database operation failure     |
| `AIProviderError`         | `AI_PROVIDER_ERROR`      | 502            | AI inference engine error      |
| `ExternalServiceError`    | `EXTERNAL_SERVICE_ERROR` | 502            | Upstream dependency error      |

### 2.3 Type Guards

`isAppError(err)`, `isValidationError(err)`, `isAuthError(err)`, `isNotFoundError(err)`.

---

## 3. Dependencies

- `devDependencies`: `@repo/typescript-config`, `typescript`
- `dependencies`: None
